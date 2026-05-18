window.addEventListener("scroll", function () {
  const header = document.querySelector("header");
  const body = document.body;
  const headerHeight = header.offsetHeight;

  if (window.scrollY > 150) {
    header.classList.add("fixed");
    body.style.paddingTop = headerHeight + "px";
  } else {
    header.classList.remove("fixed");
    body.style.paddingTop = 0;
  }
});
