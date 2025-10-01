document.addEventListener("DOMContentLoaded", () => {
  const carousels = document.querySelectorAll("[data-carousel]");

  carousels.forEach(carousel => {
    const track = carousel.querySelector(".product-carousel__track");
    const prevButton = carousel.querySelector("[data-carousel-prev]");
    const nextButton = carousel.querySelector("[data-carousel-next]");
    const slides = Array.from(track.children);
    let currentIndex = 0;

    const updateButtons = () => {
      prevButton.disabled = currentIndex === 0;
      nextButton.disabled = currentIndex >= slides.length - 1;
    };

    const moveToSlide = (index) => {
      const slideWidth = slides[0].getBoundingClientRect().width;
      track.style.transform = `translateX(-${index * slideWidth}px)`;
      currentIndex = index;
      updateButtons();
    };

    nextButton.addEventListener("click", () => {
      if (currentIndex < slides.length - 1) {
        moveToSlide(currentIndex + 1);
      }
    });

    prevButton.addEventListener("click", () => {
      if (currentIndex > 0) {
        moveToSlide(currentIndex - 1);
      }
    });

    // Initial state
    updateButtons();
  });
});