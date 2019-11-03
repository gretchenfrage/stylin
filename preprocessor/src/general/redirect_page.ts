
import {el} from 'redom';

export function html_redirect_dom(to: string): Node {
    return el('html',
        el('head',
            el('title', 'Redirect'),
            el('meta', {
                'http-equiv': 'refresh',
                content: `0;URL=${to}`,
            })
        ),
        el('body',
            el('p',
                'Attempting to redirect to: ',
                el('a', { href: to }, to),
            ),
        ),
    );
}