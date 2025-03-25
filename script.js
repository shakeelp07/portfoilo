
document.addEventListener("DOMContentLoaded", function() {
    window.onscroll = function() {myFunction()};
    var header = document.querySelector("header");
    var sticky = header.offsetTop;

    function myFunction() {
        if (window.pageYOffset > sticky) {
            header.classList.add("sticky");
        } else {
            header.classList.remove("sticky");
        }
    }
});

document.addEventListener('DOMContentLoaded', function () {
    const headerHeight = document.querySelector('header').offsetHeight;

    document.querySelectorAll('nav ul li a').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            window.scrollTo({
                top: targetElement.offsetTop - headerHeight,
                behavior: 'smooth'
            });
        });
    });
 });
document.getElementById('contact-form').addEventListener('submit', function(e) {
    e.preventDefault();

    // Get form values
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const message = document.getElementById('message').value;

    // Basic form validation
    if (name === '' || email === '' || message === '') {
        alert('Please fill in all fields');
        return;
    }
    const button = document.getElementById('submit-button');
    button.classList.add('loading');

    
});


