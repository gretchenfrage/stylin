/**
 * Console.log alias.
 */
export function println(str: string | null) {
    str = str || '';
    console.log(str);
}

export function flatMap<A, B>(array: A[], lambda: (A) => B[]): B[] {
    let fmapped = [];
    for (let a of array) {
        for (let b of lambda(a)) {
            fmapped.push(b);
        }
    }
    return fmapped;
}