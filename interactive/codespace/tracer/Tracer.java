/*
 * Records a student's own Java program running, line by line, with the Java Debug
 * Interface (the JDK's jdk.jdi module; no other libraries).
 *
 * trace.py runs it; it prints one JSON document on stdout: the raw recording, which
 * trace.py turns into the guide's step-through animation.
 *
 *   java -cp <this folder's classes> Tracer --classes DIR --main week05.arrays_lab.Main
 *        [--max-steps 400] [--timeout-ms 12000] [--output-cap 65536] [--cwd DIR]
 *
 * How it runs the program: it listens on 127.0.0.1 (JDI's SocketListen connector),
 * starts the target JVM with -agentlib:jdwp (server=n, so the target connects back),
 * no input, -Xmx256m, and Tracer$Launch as the entry point. Launch makes System.out
 * and System.err unbuffered, so text printed by a line is in the pipe by the next
 * step event, then calls the student's main.
 *
 * What it records: line steps (STEP_LINE, STEP_INTO) in the classes whose source is
 * the main class's file (Main.java); the lab's other classes (Book.java) and the JDK
 * are stepped over. At each step: the line, the method, the stack depth, the visible
 * locals, the arrays and objects they reach (ids are JDI uniqueIDs, so aliasing shows
 * as one id), and the program's output since the last step. Also: return values of
 * Main's methods, and the first uncaught exception.
 *
 * Strings carry their uniqueID too, so a literal from the pool and a new String with the
 * same text are told apart. A StringBuilder or StringBuffer is recorded like an array,
 * with its text, length and capacity. Both are read from the target's memory: recording
 * them runs no code there.
 *
 * Limits: --max-steps line steps, --timeout-ms, --output-cap bytes of output. The
 * target VM is killed on every way out.
 */
import com.sun.jdi.AbsentInformationException;
import com.sun.jdi.ArrayReference;
import com.sun.jdi.ArrayType;
import com.sun.jdi.BooleanValue;
import com.sun.jdi.Bootstrap;
import com.sun.jdi.ByteValue;
import com.sun.jdi.CharValue;
import com.sun.jdi.ClassType;
import com.sun.jdi.DoubleValue;
import com.sun.jdi.Field;
import com.sun.jdi.FloatValue;
import com.sun.jdi.IntegerValue;
import com.sun.jdi.LocalVariable;
import com.sun.jdi.Location;
import com.sun.jdi.LongValue;
import com.sun.jdi.Method;
import com.sun.jdi.ObjectReference;
import com.sun.jdi.ReferenceType;
import com.sun.jdi.ShortValue;
import com.sun.jdi.StackFrame;
import com.sun.jdi.StringReference;
import com.sun.jdi.ThreadReference;
import com.sun.jdi.Value;
import com.sun.jdi.VirtualMachine;
import com.sun.jdi.VMDisconnectedException;
import com.sun.jdi.VoidValue;
import com.sun.jdi.connect.Connector;
import com.sun.jdi.connect.ListeningConnector;
import com.sun.jdi.connect.TransportTimeoutException;
import com.sun.jdi.event.BreakpointEvent;
import com.sun.jdi.event.ClassPrepareEvent;
import com.sun.jdi.event.Event;
import com.sun.jdi.event.EventSet;
import com.sun.jdi.event.ExceptionEvent;
import com.sun.jdi.event.MethodExitEvent;
import com.sun.jdi.event.StepEvent;
import com.sun.jdi.event.VMDeathEvent;
import com.sun.jdi.event.VMDisconnectEvent;
import com.sun.jdi.event.VMStartEvent;
import com.sun.jdi.request.BreakpointRequest;
import com.sun.jdi.request.ClassPrepareRequest;
import com.sun.jdi.request.EventRequest;
import com.sun.jdi.request.EventRequestManager;
import com.sun.jdi.request.ExceptionRequest;
import com.sun.jdi.request.MethodExitRequest;
import com.sun.jdi.request.StepRequest;

import java.io.BufferedInputStream;
import java.io.ByteArrayOutputStream;
import java.io.DataInputStream;
import java.io.File;
import java.io.FileDescriptor;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.PrintStream;
import java.lang.invoke.MethodHandle;
import java.lang.invoke.MethodHandles;
import java.lang.reflect.Modifier;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Deque;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.stream.Stream;

public final class Tracer {
    static final int MAX_VALUES = 30;   // array elements recorded per array
    static final int MAX_HEAP = 40;     // arrays and objects recorded per step
    static final int MAX_DEPTH = 3;     // local -> array -> row/object -> field
    static final int MAX_STRING = 80;   // characters kept of a String
    static final int MAX_BUILDER = 1000; // characters of a StringBuilder read, to see what changes
    static final long CONNECT_MS = 10_000;
    static final Set<String> BOXES = Set.of("java.lang.Integer", "java.lang.Long", "java.lang.Short",
            "java.lang.Byte", "java.lang.Double", "java.lang.Float", "java.lang.Boolean", "java.lang.Character");
    static final Set<String> BUILDERS = Set.of("java.lang.StringBuilder", "java.lang.StringBuffer");
    // The target is a child process on this machine, so its UTF16 byte order is this one's.
    static final boolean BIG_ENDIAN = ByteOrder.nativeOrder() == ByteOrder.BIG_ENDIAN;

    // ---- options --------------------------------------------------------------------------
    final Path classes;
    final String mainClass;
    final String pkg;
    final int maxSteps;
    final long deadline;
    final long timeoutMs;
    final int outCap;
    final File cwd;

    // ---- the program's classes, from their class files ------------------------------------
    String showFile;                                        // the main class's source file
    final Set<String> shownClasses = new HashSet<>();       // classes compiled from it
    final List<String> otherClasses = new ArrayList<>();    // the lab's classes from other files

    // ---- the run ----------------------------------------------------------------------------
    VirtualMachine vm;
    Process proc;
    ThreadReference thread;
    EventRequestManager erm;
    StepRequest step;
    boolean steppingOut;
    MethodExitRequest exitRequest;
    BreakpointRequest mainBreakpoint;
    int baseDepth = -1;
    int lines;
    String stopped;            // steps | time | output | exception | null (ran to the end)
    boolean dead;
    Integer exitCode;
    String fatal;
    final List<String> events = new ArrayList<>();
    Pipe out;
    Pipe err;

    Tracer(Map<String, String> opt) {
        classes = Paths.get(opt.get("classes")).toAbsolutePath();
        mainClass = opt.get("main");
        int dot = mainClass.lastIndexOf('.');
        pkg = dot < 0 ? "" : mainClass.substring(0, dot);
        maxSteps = Integer.parseInt(opt.getOrDefault("max-steps", "400"));
        timeoutMs = Long.parseLong(opt.getOrDefault("timeout-ms", "12000"));
        deadline = System.currentTimeMillis() + timeoutMs;
        outCap = Integer.parseInt(opt.getOrDefault("output-cap", "65536"));
        cwd = opt.containsKey("cwd") ? new File(opt.get("cwd")) : null;
    }

    public static void main(String[] args) throws Exception {
        Map<String, String> opt = new HashMap<>();
        for (int i = 0; i + 1 < args.length; i += 2) {
            if (!args[i].startsWith("--")) throw new IllegalArgumentException("bad argument " + args[i]);
            opt.put(args[i].substring(2), args[i + 1]);
        }
        if (!opt.containsKey("classes") || !opt.containsKey("main")) {
            System.err.println("usage: Tracer --classes DIR --main CLASS [--max-steps N] [--timeout-ms MS] "
                    + "[--output-cap BYTES] [--cwd DIR]");
            System.exit(2);
        }
        Tracer tracer = new Tracer(opt);
        Thread hook = new Thread(tracer::kill);
        Runtime.getRuntime().addShutdownHook(hook);
        try {
            tracer.run();
        } catch (Throwable t) {
            tracer.fatal = t.toString();
        } finally {
            tracer.kill();
        }
        PrintStream stdout = new PrintStream(new FileOutputStream(FileDescriptor.out), false, StandardCharsets.UTF_8);
        stdout.print(tracer.report());
        stdout.flush();
        Runtime.getRuntime().removeShutdownHook(hook);
        System.exit(0);
    }

    // ---- running -------------------------------------------------------------------------------

    void run() throws Exception {
        scanClasses();
        ListeningConnector connector = Bootstrap.virtualMachineManager()
                .listeningConnectors().stream()
                .filter(c -> c.name().equals("com.sun.jdi.SocketListen")).findFirst()
                .orElseThrow(() -> new IllegalStateException("this JDK has no JDI socket connector"));
        Map<String, Connector.Argument> ca = connector.defaultArguments();
        ca.get("localAddress").setValue("127.0.0.1");
        ca.get("port").setValue("0");
        ca.get("timeout").setValue("200");
        String address = connector.startListening(ca);
        String port = address.substring(address.lastIndexOf(':') + 1);
        try {
            launch(port);
            long until = System.currentTimeMillis() + CONNECT_MS;
            while (vm == null) {
                try {
                    vm = connector.accept(ca);
                } catch (TransportTimeoutException e) {
                    if (!proc.isAlive() || System.currentTimeMillis() > until) break;
                }
            }
        } finally {
            connector.stopListening(ca);
        }
        if (vm == null) {
            proc.waitFor(2, TimeUnit.SECONDS);
            out.drain();
            err.drain();
            fatal = "The Java program did not start: " + (err.take() + out.take()).strip();
            return;
        }
        erm = vm.eventRequestManager();
        loop();
    }

    void launch(String port) throws IOException {
        String java = Paths.get(System.getProperty("java.home"), "bin", "java").toString();
        String launcherPath;
        try {
            launcherPath = Paths.get(Tracer.class.getProtectionDomain().getCodeSource().getLocation().toURI())
                    .toString();
        } catch (java.net.URISyntaxException e) {
            throw new IOException(e);
        }
        List<String> cmd = new ArrayList<>(List.of(java,
                "-agentlib:jdwp=transport=dt_socket,server=n,suspend=y,address=127.0.0.1:" + port,
                "-Xmx256m", "-Xss1m", "-XX:+UseSerialGC", "-XX:TieredStopAtLevel=1", "-XX:-UsePerfData",
                "-Dstdout.encoding=UTF-8", "-Dstderr.encoding=UTF-8",
                "-cp", launcherPath + File.pathSeparator + classes, Launch.class.getName(), mainClass));
        ProcessBuilder pb = new ProcessBuilder(cmd);
        if (cwd != null && cwd.isDirectory()) pb.directory(cwd);
        for (String name : List.of("JAVA_TOOL_OPTIONS", "JDK_JAVA_OPTIONS", "_JAVA_OPTIONS", "CLASSPATH")) {
            pb.environment().remove(name);
        }
        proc = pb.start();
        proc.getOutputStream().close(); // no input: a read sees the end of input at once
        out = new Pipe(proc.getInputStream());
        err = new Pipe(proc.getErrorStream());
    }

    void loop() throws Exception {
        while (stopped == null && !dead) {
            long left = deadline - System.currentTimeMillis();
            if (left <= 0) {
                halt("time");
                break;
            }
            EventSet set;
            try {
                set = vm.eventQueue().remove(Math.min(left, 50));
            } catch (VMDisconnectedException e) {
                dead = true;
                break;
            }
            if (set == null) { // still running: keep the pipes moving and watch the output cap
                out.drain();
                err.drain();
                if (overCap()) halt("output");
                continue;
            }
            for (Event event : set) {
                try {
                    handle(event);
                } catch (VMDisconnectedException e) {
                    dead = true;
                }
                if (stopped != null || dead) break;
            }
            if (stopped == null && !dead) {
                try {
                    set.resume();
                } catch (VMDisconnectedException e) {
                    dead = true;
                }
            }
        }
        if (dead && stopped == null) finishRun();
    }

    void handle(Event event) throws Exception {
        if (event instanceof VMStartEvent start) {
            thread = start.thread();
            ClassPrepareRequest prepare = erm.createClassPrepareRequest();
            prepare.addClassFilter(mainClass);
            prepare.setSuspendPolicy(EventRequest.SUSPEND_EVENT_THREAD);
            prepare.enable();
            ExceptionRequest exceptions = erm.createExceptionRequest(null, false, true);
            exceptions.setSuspendPolicy(EventRequest.SUSPEND_EVENT_THREAD);
            exceptions.enable();
        } else if (event instanceof ClassPrepareEvent prepared) {
            if (mainBreakpoint != null) return;
            List<Method> mains = prepared.referenceType().methodsByName("main", "([Ljava/lang/String;)V");
            if (mains.isEmpty() || mains.get(0).location() == null) return; // Launch reports it
            mainBreakpoint = erm.createBreakpointRequest(mains.get(0).location());
            mainBreakpoint.setSuspendPolicy(EventRequest.SUSPEND_EVENT_THREAD);
            mainBreakpoint.enable();
        } else if (event instanceof BreakpointEvent hit) {
            if (hit.request() != mainBreakpoint || baseDepth >= 0) return;
            erm.deleteEventRequest(mainBreakpoint);
            thread = hit.thread();
            baseDepth = thread.frameCount();
            exitRequest = erm.createMethodExitRequest();
            exitRequest.addThreadFilter(thread);
            filter(exitRequest);
            exitRequest.setSuspendPolicy(EventRequest.SUSPEND_EVENT_THREAD);
            newStep(StepRequest.STEP_INTO);
            recordLine(hit.location(), baseDepth);
        } else if (event instanceof StepEvent stepped) {
            onStep(stepped);
        } else if (event instanceof MethodExitEvent exit) {
            onExit(exit);
        } else if (event instanceof ExceptionEvent thrown) {
            onException(thrown);
        } else if (event instanceof VMDeathEvent || event instanceof VMDisconnectEvent) {
            dead = true;
        }
    }

    void onStep(StepEvent event) throws Exception {
        Location loc = event.location();
        boolean shown = isShown(loc);
        if (steppingOut) {
            if (!shown) return; // still outside Main.java: the step-out goes on
            steppingOut = false; // back in Main.java, part way through the calling line
            newStep(StepRequest.STEP_INTO);
            return;
        }
        if (!shown) { // inside another file's code: run it as part of the calling line
            steppingOut = true;
            newStep(StepRequest.STEP_OUT);
            return;
        }
        int depth = thread.frameCount();
        recordLine(loc, depth);
        lines++;
        if (lines >= maxSteps) {
            stopped = "steps";
            return;
        }
        // Return values are needed only inside Main's own methods, and exit events slow every call.
        boolean inner = depth > baseDepth;
        if (exitRequest.isEnabled() != inner) exitRequest.setEnabled(inner);
    }

    void onExit(MethodExitEvent event) throws Exception {
        Method method = event.method();
        if (!shownClasses.contains(method.declaringType().name())) return;
        int depth = thread.frameCount();
        if (depth <= baseDepth) return;
        StringBuilder sb = new StringBuilder();
        sb.append("{\"kind\":\"exit\"");
        Location loc = event.location();
        sb.append(",\"line\":").append(loc.lineNumber());
        sb.append(",\"method\":");
        q(sb, method.name());
        sb.append(",\"class\":");
        q(sb, method.declaringType().name());
        sb.append(",\"depth\":").append(depth);
        Value ret = event.returnValue();
        sb.append(",\"void\":").append(ret instanceof VoidValue || "void".equals(method.returnTypeName()));
        Heap heap = new Heap();
        sb.append(",\"ret\":");
        if (ret instanceof VoidValue) sb.append("null");
        else encode(sb, ret, heap, 1);
        frameState(sb, thread.frame(0), heap);
        output(sb);
        sb.append('}');
        events.add(sb.toString());
    }

    void onException(ExceptionEvent event) throws Exception {
        ObjectReference exc = event.exception();
        ThreadReference t = event.thread();
        String message = null;
        // Nothing may stop the thread while getMessage() runs in it: the trace ends here anyway.
        erm.deleteEventRequests(new ArrayList<>(erm.stepRequests()));
        erm.deleteEventRequests(new ArrayList<>(erm.methodExitRequests()));
        erm.deleteEventRequests(new ArrayList<>(erm.exceptionRequests()));
        step = null;
        try { // getMessage() also gives the helpful NullPointerException messages
            if (!exc.referenceType().name().startsWith("java.")) { // a student's own getMessage() may not return
                throw new IllegalStateException("read the field instead");
            }
            List<Method> getters = ((ClassType) exc.referenceType()).methodsByName("getMessage",
                    "()Ljava/lang/String;");
            Value v = exc.invokeMethod(t, getters.get(0), Collections.emptyList(),
                    ObjectReference.INVOKE_SINGLE_THREADED);
            if (v instanceof StringReference s) message = s.value();
        } catch (Exception e) {
            try {
                Field f = exc.referenceType().fieldByName("detailMessage");
                Value v = f == null ? null : exc.getValue(f);
                if (v instanceof StringReference s) message = s.value();
            } catch (Exception ignored) {
                // no message then
            }
        }
        // The line to blame is the top frame in Main.java (the exception may come from the JDK).
        List<StackFrame> frames = t.frames();
        int index = -1;
        for (int i = 0; i < frames.size(); i++) {
            if (isShown(frames.get(i).location())) {
                index = i;
                break;
            }
        }
        StringBuilder sb = new StringBuilder();
        sb.append("{\"kind\":\"exception\",\"exception\":");
        q(sb, exc.referenceType().name());
        sb.append(",\"message\":");
        if (message == null) sb.append("null");
        else q(sb, message);
        if (index >= 0) {
            StackFrame frame = frames.get(index);
            Location loc = frame.location();
            sb.append(",\"line\":").append(loc.lineNumber());
            sb.append(",\"method\":");
            q(sb, loc.method().name());
            sb.append(",\"class\":");
            q(sb, loc.declaringType().name());
            sb.append(",\"depth\":").append(frames.size() - index);
            frameState(sb, frame, new Heap());
        }
        output(sb);
        sb.append('}');
        events.add(sb.toString());
        stopped = "exception";
    }

    void recordLine(Location loc, int depth) throws Exception {
        StringBuilder sb = new StringBuilder();
        sb.append("{\"kind\":\"line\",\"line\":").append(loc.lineNumber());
        sb.append(",\"method\":");
        q(sb, loc.method().name());
        sb.append(",\"class\":");
        q(sb, loc.declaringType().name());
        sb.append(",\"depth\":").append(depth);
        frameState(sb, thread.frame(0), new Heap());
        output(sb);
        sb.append('}');
        events.add(sb.toString());
    }

    /** Stops a program that is still running (time or output): its last picture, then the end. */
    void halt(String why) {
        stopped = why;
        StringBuilder sb = new StringBuilder("{\"kind\":\"end\"");
        try {
            vm.suspend();
            if (thread != null && baseDepth >= 0) {
                List<StackFrame> frames = thread.frames();
                for (int i = 0; i < frames.size(); i++) {
                    Location loc = frames.get(i).location();
                    if (!isShown(loc)) continue;
                    sb.append(",\"line\":").append(loc.lineNumber());
                    sb.append(",\"method\":");
                    q(sb, loc.method().name());
                    sb.append(",\"class\":");
                    q(sb, loc.declaringType().name());
                    sb.append(",\"depth\":").append(frames.size() - i);
                    frameState(sb, frames.get(i), new Heap());
                    break;
                }
            }
        } catch (Exception e) {
            // the picture is optional; stopping is not
        }
        out.drain();
        err.drain();
        output(sb);
        sb.append('}');
        events.add(sb.toString());
    }

    /** The program ended by itself: collect the last of its output and its exit code. */
    void finishRun() {
        try {
            if (proc.waitFor(3, TimeUnit.SECONDS)) exitCode = proc.exitValue();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        out.drain();
        err.drain();
        StringBuilder sb = new StringBuilder("{\"kind\":\"end\"");
        if (exitCode != null) sb.append(",\"exitCode\":").append(exitCode);
        output(sb);
        sb.append('}');
        events.add(sb.toString());
    }

    synchronized void kill() {
        if (vm != null) {
            try {
                vm.exit(1);
            } catch (Throwable ignored) {
                // gone already
            }
            try {
                vm.dispose();
            } catch (Throwable ignored) {
                // gone already
            }
        }
        if (proc != null) {
            proc.descendants().forEach(ProcessHandle::destroyForcibly);
            proc.destroyForcibly();
            try {
                proc.waitFor(3, TimeUnit.SECONDS);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
    }

    String report() {
        StringBuilder sb = new StringBuilder("{\"file\":");
        if (showFile == null) sb.append("null");
        else q(sb, showFile);
        sb.append(",\"stopped\":");
        if (stopped == null) sb.append("null");
        else q(sb, stopped);
        sb.append(",\"lines\":").append(lines);
        sb.append(",\"started\":").append(baseDepth >= 0);
        sb.append(",\"outputBytes\":").append(out == null ? 0 : out.total + err.total);
        if (fatal != null) {
            sb.append(",\"fatal\":");
            q(sb, fatal);
        }
        sb.append(",\"events\":[");
        for (int i = 0; i < events.size(); i++) {
            if (i > 0) sb.append(",\n");
            sb.append(events.get(i));
        }
        sb.append("]}\n");
        return sb.toString();
    }

    // ---- requests and filters ----------------------------------------------------------------

    void newStep(int depth) {
        if (step != null) erm.deleteEventRequest(step);
        step = erm.createStepRequest(thread, StepRequest.STEP_LINE, depth);
        filter(step);
        step.setSuspendPolicy(EventRequest.SUSPEND_EVENT_THREAD);
        step.enable();
    }

    /** Only the lab's own classes, and of those only the ones written in Main.java. */
    void filter(EventRequest request) {
        List<String> exclude = new ArrayList<>(otherClasses);
        if (pkg.isEmpty()) {
            exclude.addAll(List.of("java.*", "javax.*", "jdk.*", "sun.*", "com.sun.*", "Tracer*"));
        }
        for (String name : exclude) {
            if (request instanceof StepRequest s) s.addClassExclusionFilter(name);
            else if (request instanceof MethodExitRequest m) m.addClassExclusionFilter(name);
        }
        if (!pkg.isEmpty()) {
            if (request instanceof StepRequest s) s.addClassFilter(pkg + ".*");
            else if (request instanceof MethodExitRequest m) m.addClassFilter(pkg + ".*");
        }
    }

    boolean isShown(Location loc) {
        return loc != null && shownClasses.contains(loc.declaringType().name());
    }

    /** Which source file each of the program's classes came from (their SourceFile attribute). */
    void scanClasses() throws IOException {
        Map<String, String> source = new HashMap<>();
        try (Stream<Path> files = Files.walk(classes)) {
            for (Path p : (Iterable<Path>) files.filter(f -> f.toString().endsWith(".class"))::iterator) {
                String[] info = classInfo(p);
                if (info != null) source.put(info[0], info[1]);
            }
        }
        String simple = mainClass.substring(mainClass.lastIndexOf('.') + 1);
        showFile = source.getOrDefault(mainClass, simple + ".java");
        if (showFile == null) showFile = simple + ".java";
        for (Map.Entry<String, String> e : source.entrySet()) {
            String name = e.getKey();
            int dot = name.lastIndexOf('.');
            String classPkg = dot < 0 ? "" : name.substring(0, dot);
            if (!classPkg.equals(pkg)) continue;
            if (showFile.equals(e.getValue())) shownClasses.add(name);
            else otherClasses.add(name);
        }
        shownClasses.add(mainClass);
    }

    static String[] classInfo(Path p) throws IOException {
        try (DataInputStream in = new DataInputStream(new BufferedInputStream(Files.newInputStream(p)))) {
            if (in.readInt() != 0xCAFEBABE) return null;
            in.readUnsignedShort();
            in.readUnsignedShort();
            int n = in.readUnsignedShort();
            Object[] pool = new Object[n];
            for (int i = 1; i < n; i++) {
                int tag = in.readUnsignedByte();
                switch (tag) {
                    case 1 -> pool[i] = in.readUTF();
                    case 3, 4, 9, 10, 11, 12, 17, 18 -> in.readInt();
                    case 5, 6 -> {
                        in.readLong();
                        i++;
                    }
                    case 7, 8, 16, 19, 20 -> pool[i] = in.readUnsignedShort();
                    case 15 -> {
                        in.readUnsignedByte();
                        in.readUnsignedShort();
                    }
                    default -> throw new IOException("unknown constant pool tag " + tag + " in " + p);
                }
            }
            in.readUnsignedShort();
            String name = ((String) pool[(Integer) pool[in.readUnsignedShort()]]).replace('/', '.');
            in.readUnsignedShort();
            int interfaces = in.readUnsignedShort();
            for (int i = 0; i < interfaces; i++) in.readUnsignedShort();
            skipMembers(in);
            skipMembers(in);
            int attributes = in.readUnsignedShort();
            for (int i = 0; i < attributes; i++) {
                String attribute = (String) pool[in.readUnsignedShort()];
                int length = in.readInt();
                if ("SourceFile".equals(attribute)) return new String[] {name, (String) pool[in.readUnsignedShort()]};
                in.skipNBytes(length);
            }
            return new String[] {name, null};
        }
    }

    static void skipMembers(DataInputStream in) throws IOException {
        int count = in.readUnsignedShort();
        for (int i = 0; i < count; i++) {
            in.skipNBytes(6);
            int attributes = in.readUnsignedShort();
            for (int j = 0; j < attributes; j++) {
                in.readUnsignedShort();
                in.skipNBytes(in.readInt());
            }
        }
    }

    // ---- what a frame holds -------------------------------------------------------------------

    /** Arrays and objects reached from one frame, recorded once each, breadth first. */
    final class Heap {
        final Map<Long, String> done = new LinkedHashMap<>();
        final Deque<Object[]> todo = new ArrayDeque<>();
        final Set<Long> queued = new HashSet<>();

        /** A reference to record later, or false when the step already holds enough. */
        boolean want(ObjectReference ref, int depth) {
            long id = ref.uniqueID();
            if (queued.contains(id)) return true;
            if (depth > MAX_DEPTH || queued.size() >= MAX_HEAP) return false;
            queued.add(id);
            todo.add(new Object[] {ref, depth});
            return true;
        }

        void fill() {
            while (!todo.isEmpty()) {
                Object[] next = todo.poll();
                ObjectReference ref = (ObjectReference) next[0];
                int depth = (Integer) next[1];
                StringBuilder sb = new StringBuilder();
                try {
                    if (ref instanceof ArrayReference array) {
                        ArrayType type = (ArrayType) array.referenceType();
                        int length = array.length();
                        sb.append("{\"kind\":\"array\",\"type\":");
                        q(sb, simpleName(type.name()));
                        sb.append(",\"elem\":");
                        q(sb, simpleName(type.componentTypeName()));
                        sb.append(",\"length\":").append(length).append(",\"values\":[");
                        int n = Math.min(length, MAX_VALUES);
                        List<Value> values = n == 0 ? List.of() : array.getValues(0, n);
                        for (int i = 0; i < values.size(); i++) {
                            if (i > 0) sb.append(',');
                            encode(sb, values.get(i), this, depth + 1);
                        }
                        sb.append("]}");
                    } else if (BUILDERS.contains(ref.referenceType().name())) {
                        builder(sb, ref);
                    } else {
                        ReferenceType type = ref.referenceType();
                        sb.append("{\"kind\":\"object\",\"class\":");
                        q(sb, simpleName(type.name()));
                        sb.append(",\"fields\":[");
                        List<Field> fields = new ArrayList<>();
                        for (Field f : type.allFields()) { // the lab's own fields, not Throwable's
                            if (!f.isStatic() && !f.isSynthetic() && isLabClass(f.declaringType().name())) {
                                fields.add(f);
                            }
                        }
                        Map<Field, Value> values = ref.getValues(fields);
                        for (int i = 0; i < fields.size(); i++) {
                            if (i > 0) sb.append(',');
                            sb.append('[');
                            q(sb, fields.get(i).name());
                            sb.append(',');
                            encode(sb, values.get(fields.get(i)), this, depth + 1);
                            sb.append(']');
                        }
                        sb.append("]}");
                    }
                } catch (Exception e) { // collected, or otherwise unreadable
                    sb.setLength(0);
                    sb.append("{\"kind\":\"gone\"}");
                }
                done.put(ref.uniqueID(), sb.toString());
            }
        }

        void write(StringBuilder sb) {
            fill();
            sb.append(",\"heap\":{");
            boolean first = true;
            for (Map.Entry<Long, String> e : done.entrySet()) {
                if (!first) sb.append(',');
                first = false;
                q(sb, Long.toString(e.getKey()));
                sb.append(':').append(e.getValue());
            }
            sb.append('}');
        }
    }

    void frameState(StringBuilder sb, StackFrame frame, Heap heap) throws Exception {
        sb.append(",\"vars\":[");
        boolean first = true;
        List<LocalVariable> vars;
        try {
            vars = frame.visibleVariables();
        } catch (AbsentInformationException e) {
            vars = List.of();
        }
        Method method = frame.location().method();
        boolean isMain = method.isStatic() && method.name().equals("main")
                && method.signature().equals("([Ljava/lang/String;)V");
        ObjectReference self = frame.thisObject();
        if (self != null) {
            sb.append("{\"name\":\"this\",\"type\":");
            q(sb, simpleName(self.referenceType().name()));
            sb.append(",\"v\":");
            encode(sb, self, heap, 1);
            sb.append('}');
            first = false;
        }
        Map<LocalVariable, Value> values = vars.isEmpty() ? Map.of() : frame.getValues(vars);
        for (LocalVariable var : vars) {
            if (isMain && var.isArgument()) continue; // main's String[] args: always empty here
            if (!first) sb.append(',');
            first = false;
            sb.append("{\"name\":");
            q(sb, var.name());
            sb.append(",\"type\":");
            q(sb, simpleName(var.typeName()));
            sb.append(",\"v\":");
            encode(sb, values.get(var), heap, 1);
            sb.append('}');
        }
        sb.append(']');
        heap.write(sb);
    }

    /** A value as JSON: "5" for a primitive (as Java prints it), {"c":..} for a char,
     *  {"s":..,"id":..} for a String (its text, and its uniqueID: which object it is),
     *  {"ref":id,"type":..} for an array, an object of the lab's classes or a
     *  StringBuilder, {"obj":type} for any other object, null for null. */
    void encode(StringBuilder sb, Value v, Heap heap, int depth) {
        if (v == null) {
            sb.append("null");
        } else if (v instanceof StringReference s) {
            String text;
            try {
                text = s.value(); // read from the target's memory: no code runs there
            } catch (Exception e) {
                text = "?";
            }
            sb.append("{\"s\":");
            q(sb, clip(text));
            if (text.length() > MAX_STRING) sb.append(",\"cut\":true");
            sb.append(",\"id\":");
            q(sb, Long.toString(s.uniqueID()));
            sb.append('}');
        } else if (v instanceof CharValue c) {
            character(sb, c.value());
        } else if (v instanceof ArrayReference a) {
            ref(sb, a, heap, depth);
        } else if (v instanceof ObjectReference o) {
            String type;
            try {
                type = o.referenceType().name();
            } catch (Exception e) {
                sb.append("null");
                return;
            }
            if (BOXES.contains(type)) {
                Field f = o.referenceType().fieldByName("value");
                Value boxed = f == null ? null : o.getValue(f);
                if (boxed instanceof CharValue c) character(sb, c.value());
                else q(sb, primitive(boxed));
            } else if (isLabClass(type) && !isEnum(o.referenceType())) {
                ref(sb, o, heap, depth);
            } else if (isEnum(o.referenceType())) {
                Field f = o.referenceType().fieldByName("name");
                Value name = f == null ? null : o.getValue(f);
                q(sb, name instanceof StringReference n ? n.value() : simpleName(type));
            } else if (BUILDERS.contains(type) && builderFields(o.referenceType()) != null) {
                ref(sb, o, heap, depth);
            } else {
                sb.append("{\"obj\":");
                q(sb, simpleName(type));
                sb.append('}');
            }
        } else {
            q(sb, primitive(v));
        }
    }

    void ref(StringBuilder sb, ObjectReference o, Heap heap, int depth) {
        boolean kept = heap.want(o, depth);
        sb.append("{\"ref\":");
        q(sb, Long.toString(o.uniqueID()));
        sb.append(",\"type\":");
        String type;
        try {
            type = simpleName(o.referenceType().name());
        } catch (Exception e) {
            type = "?";
        }
        q(sb, type);
        if (!kept) sb.append(",\"cut\":true");
        sb.append('}');
    }

    static void character(StringBuilder sb, char c) {
        sb.append("{\"c\":");
        q(sb, String.valueOf(c));
        sb.append('}');
    }

    /** At most MAX_STRING characters, then "…"; a surrogate pair is never cut in half. */
    static String clip(String text) {
        if (text.length() <= MAX_STRING) return text;
        int end = Character.isHighSurrogate(text.charAt(MAX_STRING - 1)) ? MAX_STRING - 1 : MAX_STRING;
        return text.substring(0, end) + "…";
    }

    final Map<String, Field[]> builderFields = new HashMap<>();

    /** A StringBuilder's (or StringBuffer's) value, coder and count fields, as JDK 9 to 21 keep
     *  them; null when this JDK keeps its text some other way. */
    Field[] builderFields(ReferenceType type) {
        if (!builderFields.containsKey(type.name())) {
            Field value = type.fieldByName("value");
            Field coder = type.fieldByName("coder");
            Field count = type.fieldByName("count");
            boolean ok = value != null && value.typeName().equals("byte[]") && coder != null
                    && coder.typeName().equals("byte") && count != null && count.typeName().equals("int");
            builderFields.put(type.name(), ok ? new Field[] {value, coder, count} : null);
        }
        return builderFields.get(type.name());
    }

    /**
     * A StringBuilder or StringBuffer as JSON: its text, length and capacity, and a hash of its
     * first MAX_BUILDER characters, read from its own fields (a hash computed here, in the
     * tracer). That is safer than calling its toString() in the target, which runs code the
     * program never ran: on a StringBuffer it takes the lock and fills toStringCache, so the
     * program's own next toString() would hand back a different object. Reading changes nothing.
     */
    void builder(StringBuilder sb, ObjectReference ref) {
        Field[] f = builderFields(ref.referenceType());
        Map<Field, Value> values = ref.getValues(List.of(f));
        ArrayReference bytes = values.get(f[0]) instanceof ArrayReference a ? a : null;
        int coder = values.get(f[1]) instanceof ByteValue b ? b.value() : 0; // 0 LATIN1, 1 UTF16
        int count = values.get(f[2]) instanceof IntegerValue n ? n.value() : 0;
        int capacity = bytes == null ? 0 : bytes.length() >> coder;
        // the first MAX_BUILDER characters: the text shown, and a hash that tells a change past it
        int read = Math.max(0, Math.min(Math.min(count, capacity), MAX_BUILDER));
        List<Value> raw = read == 0 ? List.of() : bytes.getValues(0, read << coder);
        StringBuilder text = new StringBuilder(read);
        for (int i = 0; i < read; i++) {
            if (coder == 0) { // one byte a character
                text.append((char) (((ByteValue) raw.get(i)).value() & 0xFF));
            } else {          // two bytes a character, in the machine's byte order
                int first = ((ByteValue) raw.get(2 * i)).value() & 0xFF;
                int second = ((ByteValue) raw.get(2 * i + 1)).value() & 0xFF;
                text.append((char) (BIG_ENDIAN ? first << 8 | second : second << 8 | first));
            }
        }
        sb.append("{\"kind\":\"builder\",\"class\":");
        q(sb, simpleName(ref.referenceType().name()));
        sb.append(",\"text\":");
        q(sb, clip(text.toString()));
        sb.append(",\"hash\":").append(text.toString().hashCode());
        sb.append(",\"length\":").append(count);
        sb.append(",\"capacity\":").append(capacity).append('}');
    }

    boolean isLabClass(String name) {
        if (pkg.isEmpty()) return !name.contains(".") && !name.startsWith("Tracer");
        return name.startsWith(pkg + ".") && name.indexOf('.', pkg.length() + 1) < 0;
    }

    static boolean isEnum(ReferenceType type) {
        return type instanceof ClassType c && c.superclass() != null && c.superclass().name().equals("java.lang.Enum");
    }

    /** A primitive value exactly as String.valueOf (so System.out.print) shows it. */
    static String primitive(Value v) {
        if (v instanceof IntegerValue i) return Integer.toString(i.value());
        if (v instanceof DoubleValue d) return Double.toString(d.value());
        if (v instanceof BooleanValue b) return Boolean.toString(b.value());
        if (v instanceof CharValue c) return String.valueOf(c.value());
        if (v instanceof LongValue l) return Long.toString(l.value());
        if (v instanceof FloatValue f) return Float.toString(f.value());
        if (v instanceof ShortValue s) return Short.toString(s.value());
        if (v instanceof ByteValue b) return Byte.toString(b.value());
        return String.valueOf(v);
    }

    static String simpleName(String name) {
        int dot = name.lastIndexOf('.');
        String simple = dot < 0 ? name : name.substring(dot + 1);
        int dollar = simple.lastIndexOf('$');
        return dollar < 0 || dollar == simple.length() - 1 ? simple : simple.substring(dollar + 1);
    }

    // ---- the program's output ------------------------------------------------------------------

    /** One of the target's output pipes, read without blocking. */
    final class Pipe {
        final InputStream in;
        final ByteArrayOutputStream pending = new ByteArrayOutputStream();
        long total;

        Pipe(InputStream in) {
            this.in = in;
        }

        void drain() {
            byte[] buf = new byte[65536];
            try {
                int n;
                while ((n = in.available()) > 0) {
                    int r = in.read(buf, 0, Math.min(n, buf.length));
                    if (r <= 0) break;
                    long room = outCap - (out.total + err.total);
                    if (room > 0) pending.write(buf, 0, (int) Math.min(r, room));
                    total += r;
                }
            } catch (IOException e) {
                // closed: nothing more to read
            }
        }

        /** The text read so far, up to the last whole UTF-8 character. */
        String take() {
            byte[] b = pending.toByteArray();
            int cut = b.length;
            for (int back = 1; back <= 3 && b.length - back >= 0; back++) {
                int c = b[b.length - back] & 0xFF;
                if ((c & 0xC0) == 0x80) continue;           // a continuation byte: look further back
                int need = c >= 0xF0 ? 4 : c >= 0xE0 ? 3 : c >= 0xC0 ? 2 : 1;
                if (need > back) cut = b.length - back;      // that character is not complete yet
                break;
            }
            pending.reset();
            pending.write(b, cut, b.length - cut);
            return new String(b, 0, cut, StandardCharsets.UTF_8);
        }
    }

    boolean overCap() {
        return out.total + err.total > outCap;
    }

    void output(StringBuilder sb) {
        out.drain();
        err.drain();
        sb.append(",\"out\":");
        q(sb, out.take());
        sb.append(",\"err\":");
        q(sb, err.take());
        if (overCap() && stopped == null) {
            stopped = "output";
        }
    }

    // ---- JSON ---------------------------------------------------------------------------------

    static void q(StringBuilder sb, String s) {
        sb.append('"');
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            switch (c) {
                case '"' -> sb.append("\\\"");
                case '\\' -> sb.append("\\\\");
                case '\n' -> sb.append("\\n");
                case '\r' -> sb.append("\\r");
                case '\t' -> sb.append("\\t");
                default -> {
                    if (c < 0x20 || c > 0x7E) sb.append(String.format("\\u%04x", (int) c));
                    else sb.append(c);
                }
            }
        }
        sb.append('"');
    }

    // ---- the target's entry point ----------------------------------------------------------------

    /**
     * Runs in the student's JVM: unbuffered System.out and System.err (so what a line prints
     * is in the pipe before the next step), then the student's main. A MethodHandle call
     * does not wrap exceptions, so an uncaught one stays uncaught.
     */
    public static final class Launch {
        public static void main(String[] args) throws Throwable {
            System.setOut(new PrintStream(new FileOutputStream(FileDescriptor.out), true, System.out.charset()));
            System.setErr(new PrintStream(new FileOutputStream(FileDescriptor.err), true, System.err.charset()));
            Class<?> target;
            try {
                target = Class.forName(args[0], false, Launch.class.getClassLoader());
            } catch (ClassNotFoundException | LinkageError e) {
                System.err.println("Error: Could not find or load main class " + args[0]);
                System.exit(1);
                return;
            }
            java.lang.reflect.Method main;
            try {
                main = target.getMethod("main", String[].class);
            } catch (NoSuchMethodException e) {
                main = null;
            }
            if (main == null || !Modifier.isStatic(main.getModifiers()) || main.getReturnType() != void.class) {
                System.err.println("Error: Main method not found in class " + args[0]
                        + ", please define the main method as:\n   public static void main(String[] args)");
                System.exit(1);
                return;
            }
            main.setAccessible(true);
            MethodHandle handle = MethodHandles.lookup().unreflect(main);
            handle.invokeExact(new String[0]);
        }
    }
}
