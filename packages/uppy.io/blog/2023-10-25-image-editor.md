---
title: 'Scaling Images on Rotation'
date: 2023-12-08
authors: [evgenia, tim]
image: '/img/blog/3.4-3.13/single-file-mode.jpg'
slug: '2023-10-25-image-editor'
published: true
toc_max_heading_level: 3
---

<!--retext-simplify disable prior-to all-of employ very represents appropriate-->

We recently released an “image scaling on rotation” feature for Uppy’s
[Image Editor](https://uppy.io/docs/image-editor/), an often-requested feature
that we’re super proud to be able to announce.

In this blog post, we’ll be taking a peek behind the curtain, as we take a
detailed look into the development of this feature, and our thought-process
approaching it.

Before we start though, take a look below at a comparison between how Uppy’s
Image Editor used to handle image rotations, and how it handles them now.

<table style={{ textAlign: "center" }}>
  <thead>
  <tr>
    <th colspan={2}>
      Rotation
    </th>
  </tr>

  <tr>
    <th>Without scaling</th>
    <th>With scaling</th>
  </tr>
  </thead>

  <tbody>
  <tr>
  <td>
    <video controls muted autoplay>
      <source src="/img/blog/2023-10-25-image-editor/without-scaling.mov" type="video/mp4" />
    </video>
  </td>

  <td>
    <video controls muted autoplay>
      <source src="/img/blog/2023-10-25-image-editor/with-scaling.mov" type="video/mp4" />
    </video>
  </td>
  </tr>
  </tbody>
</table>

Without further ado, let’s dive into some of the finer technical details, so you
can follow along and implement this feature into your own image editor.

<!--truncate-->

The above UI is present in many image editors - for example, the default image
editors on iOS and Android both employ it. Often users expect this behaviour
too, leading to some confusion when their images are left with ugly corners
after a rotation.

We implemented this in Uppy’s Image Editor last week, and the solution turned
out to be non-trivial. Since this is a pretty ubiquitous task to solve for all
image editors, we decided to release our solution to the world and write out a
post about it, instead of keeping it hidden away as part of internal notes.

## 3 Steps

There are **3 steps** to our scaling implementation:

1. Ask your designer what scaling on rotation should look like
1. Find the `.scale()` function
1. Calculating the geometry

### 1. Trust your designer

When I first approached this task, my gut-instinct was to go for the “rotated
rectangle inscribed within another rectangle” solution so that the largest-area
inscription possible is achieved. This route turned out to be an unpleasant user
experience, so take this as an important lesson in trusting your designer, and
consulting them first on what the user might want.

Alternatively, you can choose to trust our designer’s advice by:

- always rotating the image around the center of the image (intersection of the
  diagonals)
- just enlarging the image to remove any empty corners

### 2. Find the `.scale()` function

To enlarge the image in a way that covers empty corners, we first need a scaling
function. Uppy uses [cropperjs v1.x](https://github.com/fengyuanchen/cropperjs)
as an image editing library, which exposes the `cropper.scale(scalingFactor)`
function. Most image editing libraries are likely to have a similar function,
but of course feel free to code one yourself if you feel up to the challenge.

Importantly, the scaling function should
[uniformly enlarge](<https://en.wikipedia.org/wiki/Scaling_(geometry)#Uniform_scaling>)
the image _around its center_, where the `scalingFactor` is determined by
`desiredHeight/oldHeight`.

### 3. Calculate the geometry

Now, we want to draw our before-rotation & after-rotation shapes on the same
picture, and apply some trigonometry. If you need to brush up on the mathematics
behind this, we recommend watching the following Khan Academy lessons on
[how angles work](https://www.khanacademy.org/test-prep/praxis-math/praxis-math-lessons/gtp--praxis-math--lessons--geometry/a/gtp--praxis-math--article--angles--lesson)
and
[how sines and cosines work](https://www.khanacademy.org/math/geometry/hs-geo-trig/hs-geo-trig-ratios-intro/a/finding-trig-ratios-in-right-triangles),
as these cover everything you’ll need to follow along.

In the images below, we see what happens on rotation by default. To remove the
empty corners, the user would have to drag around the edges of the cropbox. What
we can do instead is scale the image (in the directions shown by the <span
style={{ color: `rgb(127, 194, 65)` }}>green arrows</span>) so that these
corners disappear.

<table style={{ background: `rgb(250, 250, 250)` }}>
  <thead>
  <tr><th colspan={2}>What happens on rotation</th></tr>
  </thead>

  <tbody>
  <tr>
  <td width="50%">
    <img style={{ maxWidth: 300 }} src="/img/blog/2023-10-25-image-editor/1a.jpg" />
  </td>

  <td width="50%">
    <img style={{ maxWidth: 340 }} src="/img/blog/2023-10-25-image-editor/1b.jpg" />
  </td>
  </tr>
  </tbody>
</table>

So, to cover up these checkered corners, we will need to scale the image. If we
cover up the larger corner, the smaller corner will get covered up
automatically, so our code takes the form of
`scale(Math.max(scalingFactor1, scalingFactor2))`. These two scaling factors are
calculated very similarly, so we’ll only focus on calculating only one of them
in this tutorial (although the full solution is given in the conclusion).

In the images below, the <span style={{ color: `rgb(127, 194, 65)` }}>green
rectangle</span> represents the desired dimensions of our image after it’s
scaled. Our scaling function (and hopefully yours) is defined in such a way that
if we have the image of height `h`, and we want to scale it up to height `H`, we
need to execute `.scale(H/h)`. Since we already know `h`, as it’s the height of
our image, we only need to find `H` to complete our scaling function.

<table style={{ background: "rgb(250, 250, 250)" }}>
  <thead>
  <tr><th colspan={2}>We want to find H</th></tr>
  </thead>

  <tbody>
  <tr>
  <td width="50%">
    <img src="/img/blog/2023-10-25-image-editor/2a.jpg" />
  </td>

  <td width="50%">
    <img src="/img/blog/2023-10-25-image-editor/2b.jpg" />
  </td>
  </tr>
  </tbody>
</table>

For the rest of the tutorial, the following steps are then automatic - as we
know all the angles in the image, we know the image’s width and height, and we
know to find `H`.

<p style={{ padding: 0 }}>The easiest way to go about it, is to first annotate the image with all the
relevant angles. We’ll be using <span
style={{ color: `rgb(26, 196, 213)` }}>blue </span> for the rotation angle
 <code>α</code>, and <span style={{ color: `rgb(224, 128, 193)` }}>pink </span>
for <code>90 - α</code>:</p>

<table style={{ background: "rgb(250, 250, 250)", textAlign: "center" }}>
  <thead style={{ display: "table", width: "100%" }}>
  <tr><th>Color all angles</th></tr>
  </thead>

  <tbody style={{ display: "table", width: "100%" }}>
  <tr>
  <td>
    <img style={{ width: 500 }} src="/img/blog/2023-10-25-image-editor/3.jpg" />
  </td>
  </tr>
  </tbody>
</table>

We can then find `H`, by adding the two outer sides of these triangles.

<table style={{ background: "rgb(250, 250, 250)" }}>
  <thead>
  <tr><th colspan={2}>Add two triangle sides: H = sin(α - 90) * h + sin(α) * w</th></tr>
  </thead>

  <tbody>
  <tr>
  <td width="50%">
    <img src="/img/blog/2023-10-25-image-editor/4a.jpg" />
  </td>

  <td width="50%">
    <img src="/img/blog/2023-10-25-image-editor/4b.jpg" />
  </td>
  </tr>
  </tbody>
</table>

So, now we have our desired `H`! We know one of our scaling factors is `H/h`.
Now, we just need to find our other scaling factor, which is `W/w`. This follows
a similar process, and you can find the calculations as part of the full
solution below.

```javascript
scalingFactor
= max(scalingFactor1, scalingFactor2)
= max(H/h, W/w)
= max(
  (sin(α - 90) * h + sin(α) * w) / h,
  (sin(α) * h + sin(α - 90) * w) / w
)
```

## Conclusion

In Uppy, our code ended up looking like this:

```javascript
function getScalingFactor(w, h, rotationAngle) {
	const α = Math.abs(toRadians(rotationAngle));

	const scalingFactor = Math.max(
		(Math.sin(α) * w + Math.cos(α) * h) / h,
		(Math.sin(α) * h + Math.cos(α) * w) / w,
	);

	return scalingFactor;
}
const image = cropper.getImageData();
const scaleFactor = getScalingFactor(image.width, image.height, rotationAngle);
cropper.scale(scaleFactor);
```

You can see the full version
[on GitHub](https://github.com/transloadit/uppy/blob/12e08ada02b9080bd5e1d19526bdf8a2010e62a1/packages/%40uppy/image-editor/src/utils/getScaleFactorThatRemovesDarkCorners.js).

<details>
  <summary>Bonus content: our founder’s (Tim Koschuetzki) initial scribbled notes with the solution</summary>
  <img src="/img/blog/2023-10-25-image-editor/tim.jpg"/>
</details>
