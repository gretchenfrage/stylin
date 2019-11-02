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

/**
 * Assert non-null, non-undefined.
 */
export function present<T>(value: T, value_name: string): T {
    if (value != null) {
        return value;
    } else {
        throw `value failed to validate: ${value_name}`;
    }
}

/**
 * Try different producers until getting one that's non-null, non-undefined.
 */
export function first_present<T>(value_name: string, producers: (() => T)[]): T {
    for (let producer of producers) {
        let value = producer();
        if (value != null) {
            return value;
        }
    }

    throw `no producer could produce: ${value_name}`;
}