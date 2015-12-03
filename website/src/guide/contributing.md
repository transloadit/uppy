---
type: guide
order: 20
title: "Contributing Guidelines"
---

## CSS Guidelines

The CSS standards followed in this project closely resemble those from [Medium's CSS Guidelines](https://gist.github.com/fat/a47b882eb5f84293c4ed). If it's not mentioned here, follow their guidelines.

### Naming Conventions

This project uses naming conventions adopted from the SUIT CSS framework. 
[Read about them here](https://github.com/suitcss/suit/blob/master/doc/naming-conventions.md).

To quickly summarize:

#### Utilities

Syntax: u-[sm-|md-|lg-]<utilityName>

```css
.u-utilityName
.u-floatLeft
.u-lg-col6
```

#### Components

Syntax: [<namespace>-]<ComponentName>[-descendentName][--modifierName]

```css
.twt-Button /* Namespaced component */
.MyComponent /* Components pascal cased */
.Button--default /* Modified button style */
.Button--large

.Tweet
.Tweet-header /* Descendents */
.Tweet-bodyText

.Accordion.is-collapsed /* State of component */
.Accordion.is-expanded
```

### SASS

This project uses SASS, with some limitations on nesting.  One-level deep nesting is allowed, but nesting may not extend a selector by using the `&` operator.  For example:

```sass
/* BAD */
.Button {
  &--disabled {
    ...
  }
}

/* GOOD */
.Button {
  ...
}

.Button--disabled {
  ...
}
```

### Mobile-first Responsive Approach

Style to the mobile breakpoint with your selectors, then use `min-width` media queries to add any styles to the tablet or desktop breakpoints.

### Selector, Rule Ordering

- All selectors are sorted alphabetically and by type.
- HTML elements go above classes and IDs in a file.
- Rules are sorted alphabetically.

```sass
/* BAD */
.wrapper {
  width: 940px;
  margin: auto;
}

h1 {
  color: red;
}

.article {
  width: 100%;
  padding: 32px;
}

/* GOOD */
h1 {
  color: red;
}

.article {
  padding: 32px;
  width: 100%;
}

.wrapper {
  margin: auto;
  width: 940px;
}
```
