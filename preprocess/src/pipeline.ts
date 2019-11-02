
export type Pluralize<T extends Node | Node[]> =
    T extends Node[] ?
        Node [] | Node
        :
        Node;

function pluralize<T extends Node | Node[]>(elem: Pluralize<T>): Node[] {
    if (elem instanceof Node) {
        return [elem];
    } else {
        return <Node[]> elem;
    }
}

interface PluralPipeline<
    I extends Node | Node[],
    O extends Node | Node[],
    > {
    (input: Pluralize<I>): O;

    then<
        A extends Pluralize<O>,
        B extends Node | Node[],
        >
    (after: PluralPipeline<A, B>): PluralPipeline<I, B>;
}
