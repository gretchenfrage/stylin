
import java.util.HashMap;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.function.Function;

public class ClassMatcher<I, O> {
    private final Map<Class<? extends I>, Function<? extends I, O>> cases;
    private Function<I, O> optionalDefault;

    public ClassMatcher() {
        this.cases = new HashMap<>();
        this.optionalDefault = null;
    }

    public <C extends I> ClassMatcher<I, O> withCase(Class<C> key, Function<C, O> handler) {
        this.cases.put(key, handler);
        return this;
    }

    public ClassMatcher<I, O> withDefault(Function<I, O> handler) {
        this.optionalDefault = handler;
        return this;
    }

    public O match(I object) throws NoSuchElementException {
        Function<I, O> handler;
        handler = (Function<I, O>) cases.get(object.getClass());
        if (handler == null) {
            handler = optionalDefault;
        }
        if (handler != null) {
            return handler.apply(object);
        } else {
            throw new NoSuchElementException("No case for " + object);
        }
    }
}
