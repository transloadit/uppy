---
title: Performance Comparisons
---

## TodoMVC Benchmark

> *Last Updated: 2014-10-12*

Looking for the TodoMVC Benchmark? It's been removed because after discussion with some other framework authors we have agreed that:

1. The original intention of these benchmarks were for comparing Browser performance rather than that of frameworks. The "synchrorously trigger an action xxx times" test routine doesn't reflect meaningful real world user actions.

2. Due to internal implementation differences, frameworks that uses async rendering (e.g. Uppy, Om, Mercury) gains the advantage by skipping part of the calculations that happened in the same event loop. The real world user experience doesn't demonstrate such dramatic difference.

3. Overall this benchmark suite gave rise to more controversy than constructive insights, so it's been removed and I'd be happy to replace it with a more meaningful way to measure front-end performance.
