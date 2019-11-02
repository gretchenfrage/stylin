
import { el } from 'redom';

export interface PageMeta {
    title: string;
    path: string[];
    mini: string;
}

export function content_wrap(content: Node[], meta: PageMeta): Node {
    let header_path: Node[] = [
        el('span.header-path-sep', 'ME:/ '),
        el('a.header-path-part', { href: '/index.html' }, 'home page'),
    ];
    for (let i = 0; i < meta.path.length; i++) {
        let path_part: string = meta.path[i];

        header_path.push(el('span.header-path-sep', ' / '));

        if ((i + 1) == meta.path.length) {
            header_path.push(el('span.header-path-head', path_part));
        } else {
            header_path.push(el('span.header-path-part', path_part));
        }
    }


    return el('html', { lang: 'en' },
        el('head',
            el('meta', { charset: 'UTF-8' }),
            el('title', `PSK | ${meta.mini}`),
            el('link', {
                rel: 'stylesheet',
                type: 'text/css',
                href: '/css/style.css'
            }),
        ),
        el('body',
            el('div.main-column',

                el('header#header',
                    el('span.header-text',
                        el('span.header-path', header_path),
                        el('span.header-trademark', 'Phoenix Kahlo')
                    )
                ),

                el('article#content',
                    el('header.title-block', el('span.title', meta.title)),
                    content,
                ),

            )
        ),
    );
}

export function column_wrap(content: Node[], col_class: string): Node {
    return el('div', { className: col_class}, content);
}