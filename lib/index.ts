interface ComponentOptions<Props> {
  props: Props;
  doc: DocumentFragment;
}
interface Component {
  __is_component: true;
  doc: DocumentFragment;
}

/**
 * A factory function to create new components based on the passed properties.
 */
export type ComponentFactory<Props> = (props: Props) => Component;
/**
 * Any kind of DOM content that can be {@link mount}ed.
 */
export type Mountable =
  | null
  | Node
  | /* text content, not HTML! */ string
  | Component
  | Mountable[];

/*============================================ State  ============================================*/

let currentCtx: ComponentOptions<unknown> | null = null;

/*========================================== Component  ==========================================*/

/**
 * Create a {@link ComponentFactory} that uses the passed setup function for component
 * initialization.
 * @param setup The setup function. It is run in the proper context to synchronously utilize any of
 *        the provided `use*` functions below.
 * @returns A new component factory.
 *
 * @see useRef
 * @see useMount
 * @see useRefMount
 * @see useHtml
 */
export function component<Props>(
  setup: (opts: ComponentOptions<Props>) => void,
): ComponentFactory<Props> {
  return (props: Props): Component => {
    const doc = document.createDocumentFragment();
    const opts: ComponentOptions<Props> = { props, doc };

    const prevCtx = currentCtx;
    currentCtx = opts;
    try {
      setup(opts);
    } finally {
      currentCtx = prevCtx;
    }
    return { __is_component: true, doc };
  };
}

function useCtx<T>(cb: (opts: ComponentOptions<unknown>) => T): T {
  if (currentCtx === null) {
    throw new Error("useCtx must be called inside a component");
  }
  return cb(currentCtx);
}

function useAssertEl<T extends Element = HTMLElement>(selector: string): T {
  return useCtx(({ doc }) => {
    const refEl = doc.querySelector<T>(selector);
    if (refEl === null) {
      throw new Error(`Could not find query selector target: ${selector}`);
    }
    return refEl;
  });
}

/**
 * Retrieve a reference element from the component DOM.
 * @param name The reference name.
 * @returns The specified reference element.
 */
export function useRef<T extends Element = HTMLElement>(name: string): T {
  return useAssertEl<T>(`.ref\\:${name}`);
}

/**
 * Append the passed {@link Mountable} into the component DOM.
 * @param content The content to mount.
 */
export function useMount(content: Mountable): void {
  useCtx(({ doc }) => mount(content, doc));
}

/**
 * Append the passed {@link Mountable} into the component DOM at the specified reference element.
 * @param name The reference name.
 * @param content The content to mount.
 */
export function useRefMount(name: string, content: Mountable) {
  mount(content, useRef(name));
}

/*---------------------------------------- Bootstrapping  ----------------------------------------*/

/**
 * Mount the passed content onto the passed mount target. If the mount target is a template element
 * with a parent element, its content will be moved in front of the template element afterward.
 * This makes it possible to easily use template elments to act as pure reference points in the DOM.
 * @param content The content to mount.
 * @param mountTarget The target element to append to.
 */
export function mount(
  content: Mountable,
  mountTarget: Element | DocumentFragment,
): void {
  const isTemplate = mountTarget.nodeName === "TEMPLATE";
  const targetEl = isTemplate
    ? (mountTarget as HTMLTemplateElement).content
    : mountTarget;
  doMount(content, targetEl);
  if (isTemplate && mountTarget.parentElement != null) {
    mountTarget.parentElement.insertBefore(
      (mountTarget as HTMLTemplateElement).content,
      mountTarget,
    );
  }
}

function doMount(
  content: Mountable,
  mountTarget: Element | DocumentFragment,
): void {
  if (content == null) {
    return;
  }
  if (Array.isArray(content)) {
    for (const it of content) {
      doMount(it, mountTarget);
    }
    return;
  }
  const fragment = isComponent(content) ? content.doc : content;
  mountTarget.append(fragment);
}

function isComponent(content: Mountable): content is Component {
  return (
    content != null &&
    ((content as { __is_component?: true }).__is_component ?? false)
  );
}

/*----------------------------------------- HTML Parsing -----------------------------------------*/

/**
 * Parse the passed HTML string into a DocumentFragment to be ready for use.
 * @param html The HTML string.
 * @returns The parsed {@link DocumentFragment}.
 */
export function parseHtml(html: string): DocumentFragment {
  const el = document.createElement("template");
  el.innerHTML = html;
  return el.content;
}

/**
 * A convenience template literal formatter for {@link parseHtml}.
 * @returns The parsed {@link DocumentFragment}.
 * @see parseHtml
 */
export function html(
  strings: TemplateStringsArray,
  ...values: unknown[]
): DocumentFragment {
  return parseHtml(String.raw(strings, ...values));
}
