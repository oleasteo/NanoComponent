# NanoComponent

**NanoComponent** is a very lightweight, vanilla TypeScript / JavaScript utility library that allows you to create and manage simple, reusable components in your web applications.
This library allows for a straightforward way to split your HTML and JavaScript into small, manageable pieces without a full-fledged framework.
It is best used with a bundler like `vite`.

## Features

- **Simple HTML parsing**: A template literal formatter can be used to parse HTML fragments within JS.
- **Component Properties**: Re-use component factories with different properties (non-reactive).
- **Component as Property**: Use components or HTML fragments as component properties.
- **Element References**: Easily get a JS reference to tagged DOM elements (e.g. mount slots).
- **Lightweight**: No dependencies, pure vanilla TypeScript / JavaScript (4kB unminified with jsdocs ^^).

## Not a feature

This library **does not** provide any reactivity, async components, component lifecycles, template syntax, scoped styles or server-side rendering.
It solely provides basics to glue together multiple HTML + JS fragments. This is by design.

This library is intended to help quickly bootstrap simple web pages without the need for heavy frameworks or verbose web components.

## Installation

You can install NanoComponent via npm (or any tool of your choice):

```bash
npm i @asteo/nano-component
```

## Usage

### Example: Counter Component

A simple example would look like this:

```typescript
// MyCounter.ts

import { component, useMount, useRef, useRefMount, html, Mountable } from "@asteo/nano-component";

interface Props {
  label: Mountable;
  value: number;
}

export default component<Props>(({ props: { label, value } }) => {
  // append a parsed DocuemntFragment to the component DOM
  useMount(html`
    <div class="my-first-component">
      <template class="ref:label"></template>
      is:
      <span class="ref:value">${value}</span>
      <button type="button"" class="ref:btn">Increase!</button>
    </div>
  `);

  // mount label prop to the "ref:label" position marker
  useRefMount("label", label);

  // query by "ref:value" and "ref:btn" classes respectively
  const valueEl = useRef("value");
  const btnEl = useRef("btn");

  // add click listener to button; just some vanilla js
  btnEl.addEventListener("click", () => {
    valueEl.textContent = `${++value}`;
  });
});

```

### Mounting the root component

You'll want your root component to be mounted with the `mount` function:

```typescript
// index.ts

import { mount, html } from "@asteo/nano-component";
import MyCounter from "./MyCounter.ts";

mount(
  MyCounter({
    label: html`The <span style="color:red">answer</span>`,
    value: 42,
  }),
  document.body,
);
```

### Nested components

As you can see in the example with the `label` property, just use `Mountable` and `useRefMount(...)` for nested components or HTML fragments.
We could've passed in any component(s) to the `label` property in the example above.
The global `mount` function accepts `Mountable` as well, so we can mount multiple components at the same time, for example.

```typescript
mount(
  [
    MyCounter({
      label: html`The <span style="color:red">answer</span>`,
      value: 42,
    }),
    // feature flag use-case
    showMultiple
      ? [
          MyCounter({ label: "First", value: -1 }),
          MyCounter({ label: "Second", value: 0 }),
        ]
      : null,
  ],
  document.body,
);
```

This simple structure allows a lot of flexibility. Feel free to experiment!

## API

### Types

#### `Mountable`

The `Mountable` type should primarily be used to define nested content properties.
It is accepted by all mount functions below.

```typescript
type Mountable =
  | null // accept "no content" values
  | Node // accept vanilla DOM Nodes (including html`...` template literals)
  | string // accept text content (**not** HTML)
  | Component // accept components
  | Mountable[]; // accept lists of all the above (including recursive lists of course)
```

### Globals

#### `component<Props>(setup: fn)`

Creates a ComponentFactory that uses the passed setup function for component initialization.
The setup function receives a single argument of `{ props: Props, doc: DocumentFragment }`.
The `doc` is the root DOM fragment to be filled by the setup function.
This is mainly supposed to be done by the component-scoped helper functions below.

#### `mount(content: Mountable, mountTarget: Element | DocumentFragment)`

Mounts the passed content onto the passed mount target.

**Caution**: For `<template>` mount targets, the content is moved in front of the template element instead (useful for `useRefMount`; see below).

#### `html` template literal

The `html` template literal formatter parses the string into a DocumentFragment; ready to be used with mount functions.

### Component-Scoped helpers

These helper functions must be used synchronously within the setup function of components. The use the components DOM inherently for convenience.

#### `useRef<T>(name: string)`

Retrieves an element reference from the component DOM. The element must have the class `ref:<name>` (e.g. `ref:button`).
The default return type is `HTMLElement`. This can be further specified by the generic parameter `T`.

**Caution**: Refences are simply resolved via `querySelector` at that moment. If nested content is already mounted, it will _pollute_ the DOM that is searched. Consider collecting references before any nested mounting.

#### `useMount(content: Mountable)`

Appends the passed content to the component DOM.

#### `useRefMount(name: string, content: Mountable)`

Appends the passed content to the specified reference element within the component DOM.

For `<template>` mount targets, the content is moved in front of the template element instead.
This allows to easily use `<template class="ref:slot">` to act as pure reference points in the DOM (no useless container elements).

## Recommendations

### HTML Files

It is recommended to use vite or a similar bundler. This allows to simply import HTML files as strings (`?raw` with vite) within your ts/js file. Those can be parsed to `Mountable`s via the `html` template literal.

```typescript
import MyFragment from "./MyFragment.html?raw";

// use with any mount function via the template literal parser; e.g.
mount(html`${MyFragment}`, document.body);
```

It is not recommended to move component templates into dedicated HTML files. But dumb (no js) HTML fragments can easily be split into dedicated files in this manner.

### Refs first

Mounting sub-content _pollutes_ the component DOM with arbitrary children. Thus, it is recommended to query `useRef` first for complex nested components. You can always use the global `mount` function onto the refs later on.

### Singleton Components

If a component is only to exist once, you should export the component instance directly, not the factory.

```typescript
// TheHeader.ts

export default component<void>(() => {

  // [component logic]

})();
// the trailing `()` immediately creates and exports just an instance
```

### File Naming

It is recommended to name component files in TitleCase (e.g. `MyCounter.ts`, `TheHeader.ts`, `TheFooter.html`).
Singleton names are recommended to be prefixed with "The".

## Contributing

Contributions are welcome! If you find a bug or have a feature request, please open an issue or submit a pull request.

## License

NanoComponent is licensed under the MIT License. See the [LICENSE](LICENSE) file for more information.
