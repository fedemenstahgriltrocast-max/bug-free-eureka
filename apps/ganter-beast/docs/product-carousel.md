# Product Carousel Overview

The product carousel used on the order page lives in `order.html` inside the `section.order` element. The markup begins with the `.product-carousel` wrapper and contains the previous/next buttons, a `.product-carousel__viewport` for clipping, and the `.product-carousel__track` list that holds each `.product-card` entry.

Key selectors for the carousel’s presentation (spacing, arrow sizing, and typography) are defined in `main.css` near the `.product-carousel` block. Carousel behavior—handling arrow clicks, pagination dots, and disabling controls when the beginning or end is reached—is implemented in `main.js` within the `initProductCarousel` logic.

The carousel does **not** depend on a white background card container for layout or functionality. Its structure relies on flexbox for the track and absolutely positioned controls that work independently of background styling. Removing the outer card styling simply lets the carousel sit directly on the page background while preserving scrolling, navigation, and sizing behavior.

## Can the carousel run without a white background?

Yes. The `section.order`, `.product-carousel`, and individual `.product-card` elements all set their backgrounds to `none`/`transparent`, so there is no visual card wrapper around the imagery or controls. The layout (grid container, viewport clipping, and flexible card widths) and JavaScript interactions continue to operate exactly the same whether a decorative wrapper is present or not. If a future design needs a background, it can be reintroduced through CSS without affecting functionality.
