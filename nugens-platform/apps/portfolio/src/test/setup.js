import "@testing-library/jest-dom";

// jsdom (the DOM implementation used by the test environment) doesn't
// implement IntersectionObserver at all — ProofOfWork.jsx uses it for the
// scroll-reveal animation (see the useInView hook). Without this mock,
// every test would crash immediately with "IntersectionObserver is not
// defined" before even getting to what's actually being tested.
class IntersectionObserverMock {
  constructor(callback) {
    this.callback = callback;
  }
  observe(target) {
    // Immediately report the element as visible — tests don't need to
    // simulate real scroll behavior, they just need the reveal animation
    // to not block content from rendering/being queryable.
    this.callback([{ isIntersecting: true, target }]);
  }
  unobserve() {}
  disconnect() {}
}

global.IntersectionObserver = IntersectionObserverMock;
