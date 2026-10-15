var cart = [];
try { cart = JSON.parse(localStorage.getItem("alash-cart")) || []; } catch (e) { cart = []; }

var cartBox = document.getElementById("cart");
var overlay = document.getElementById("overlay");
var wishBox = document.getElementById("wishlist");

var wishlist = [];
try { wishlist = JSON.parse(localStorage.getItem("alash-wishlist")) || []; } catch (e) { wishlist = []; }

function saveCart() {
    try { localStorage.setItem("alash-cart", JSON.stringify(cart)); } catch (e) {}
}

function renderCart() {
    var list = document.getElementById("cart-items");
    var total = 0;
    list.innerHTML = "";

    if (cart.length === 0) {
        list.innerHTML = "<li>Your cart is empty.</li>";
    }

    cart.forEach(function (item) {
        total += item.price;
        var li = document.createElement("li");
        li.innerText = item.name + " - \u20B1" + item.price;
        list.appendChild(li);
    });

    document.getElementById("cart-total").innerText = total;
    document.getElementById("cart-count").innerText = cart.length;
}

function openCart() { wishBox.classList.remove("open"); cartBox.classList.add("open"); overlay.hidden = false; }
function closeCart() { cartBox.classList.remove("open"); wishBox.classList.remove("open"); overlay.hidden = true; }
function openWishlist() { cartBox.classList.remove("open"); wishBox.classList.add("open"); overlay.hidden = false; }

// "Add To Cart"
document.querySelectorAll("button[data-name]").forEach(function (btn) {
    btn.onclick = function () {
        cart.push({ name: this.dataset.name, price: Number(this.dataset.price) });
        saveCart();
        renderCart();
        openCart();
    };
});

var productSort = document.getElementById("sort-products");
if (productSort) {
    var productGrid = document.querySelector("#products .grid");
    var originalProducts = Array.from(productGrid.querySelectorAll(".product"));

    productSort.onchange = function () {
        var products = originalProducts.slice();
        if (this.value !== "featured") {
            products.sort(function (a, b) {
                var priceDifference = Number(a.querySelector(".add").dataset.price) -
                    Number(b.querySelector(".add").dataset.price);
                return this.value === "price-low-high" ? priceDifference : -priceDifference;
            }.bind(this));
        }
        products.forEach(function (product) { productGrid.appendChild(product); });
    };
}

// wishlist
function saveWishlist() {
    try { localStorage.setItem("alash-wishlist", JSON.stringify(wishlist)); } catch (e) {}
}

function wishIndex(name) {
    for (var i = 0; i < wishlist.length; i++) {
        if (wishlist[i].name === name) { return i; }
    }
    return -1;
}

// turn the heart
function syncHearts() {
    document.querySelectorAll(".fav").forEach(function (btn) {
        var name = btn.closest(".product").querySelector("h3").innerText;
        var on = wishIndex(name) !== -1;
        btn.classList.toggle("on", on);
        btn.setAttribute("aria-pressed", on);
        btn.setAttribute("aria-label", on ? "Remove from wishlist" : "Add to wishlist");
    });
}

function renderWishlist() {
    var list = document.getElementById("wish-items");
    var count = document.getElementById("wish-count");
    list.innerHTML = "";

    if (wishlist.length === 0) {
        list.innerHTML = "<li>Your wishlist is empty. Tap the heart on a product to save it.</li>";
    }

    wishlist.forEach(function (item) {
        var li = document.createElement("li");
        li.className = "wish-item";

        var img = document.createElement("img");
        img.src = item.img;
        img.alt = item.name;

        var info = document.createElement("div");
        var title = document.createElement("h4");
        title.innerText = item.name;
        var price = document.createElement("p");
        price.className = "wish-price";
        price.innerText = "\u20B1" + item.price;

        var actions = document.createElement("div");
        actions.className = "wish-actions";

        var add = document.createElement("button");
        add.className = "btn small";
        add.innerText = "Add to cart";
        add.onclick = function () {
            cart.push({ name: item.name, price: item.price });
            saveCart();
            renderCart();
            openCart();
        };

        var remove = document.createElement("button");
        remove.className = "ghost small";
        remove.innerText = "Remove";
        remove.onclick = function () {
            wishlist.splice(wishIndex(item.name), 1);
            saveWishlist();
            renderWishlist();
            syncHearts();
        };

        actions.appendChild(add);
        actions.appendChild(remove);
        info.appendChild(title);
        info.appendChild(price);
        info.appendChild(actions);
        li.appendChild(img);
        li.appendChild(info);
        list.appendChild(li);
    });

    count.innerText = wishlist.length;
    count.hidden = wishlist.length === 0;
}

// heart button: saves or removes the product, then shows it in the wishlist
document.querySelectorAll(".fav").forEach(function (btn) {
    btn.onclick = function () {
        var card = this.closest(".product");
        var name = card.querySelector("h3").innerText;
        var at = wishIndex(name);

        if (at === -1) {
            wishlist.push({
                name: name,
                price: Number(card.querySelector(".add").dataset.price),
                img: card.querySelector("img").getAttribute("src")
            });
            openWishlist();
        } else {
            wishlist.splice(at, 1);
        }

        saveWishlist();
        renderWishlist();
        syncHearts();
    };
});

document.getElementById("open-wishlist").onclick = openWishlist;
document.getElementById("close-wishlist").onclick = closeCart;
var footerWish = document.getElementById("footer-wishlist");
if (footerWish) {
    footerWish.onclick = function (e) { e.preventDefault(); openWishlist(); };
}

// share button: share the page link, or copy it
document.querySelectorAll(".share").forEach(function (btn) {
    btn.onclick = function () {
        var url = location.href;
        if (navigator.share) { navigator.share({ title: "ALash", url: url }); }
        else if (navigator.clipboard) { navigator.clipboard.writeText(url); alert("Link copied!"); }
    };
});

document.getElementById("open-cart").onclick = openCart;
document.getElementById("close-cart").onclick = closeCart;
overlay.onclick = closeCart;
document.onkeydown = function (e) { if (e.key === "Escape") closeCart(); };

document.getElementById("clear-cart").onclick = function () {
    cart = [];
    saveCart();
    renderCart();
};

// checkout and mode of payment
var payBox = document.getElementById("pay");
var payForm = document.getElementById("pay-form");
var payNumber = document.getElementById("pay-number");
var payError = document.getElementById("pay-error");

var payInfo = {
    gcash: { label: "GCash", mobile: true,  note: "Enter your GCash mobile number. You will confirm the payment in the GCash app." },
    maya:  { label: "Maya", mobile: true,  note: "Enter your Maya mobile number. You will confirm the payment in the Maya app." },
    card:  { label: "Credit / debit card", mobile: false, note: "You will enter your card details on a secure payment page." },
    cod:   { label: "Cash on delivery", mobile: false, note: "Pay in cash when your order arrives." }
};

function selectedMethod() {
    var picked = payForm.querySelector('input[name="method"]:checked');
    return picked ? picked.value : null;
}

function updatePayFields() {
    var info = payInfo[selectedMethod()];
    payNumber.hidden = !(info && info.mobile);
    document.getElementById("pay-note").innerText = info ? info.note : "";
    payError.hidden = true;
}

payForm.querySelectorAll('input[name="method"]').forEach(function (radio) {
    radio.onchange = updatePayFields;
});

document.getElementById("checkout").onclick = function () {
    if (cart.length === 0) { alert("Your cart is empty."); return; }

    var list = document.getElementById("pay-summary");
    var total = 0;
    list.innerHTML = "";
    cart.forEach(function (item) {
        total += item.price;
        var li = document.createElement("li");
        li.innerText = item.name + " - \u20B1" + item.price;
        list.appendChild(li);
    });
    document.getElementById("pay-total").innerText = total;

    payForm.reset();
    updatePayFields();
    payForm.hidden = false;
    document.getElementById("pay-done").hidden = true;
    closeCart();
    payBox.showModal();
};

payForm.onsubmit = function (e) {
    e.preventDefault();
    var method = selectedMethod();
    var info = payInfo[method];

    if (!method) {
        payError.innerText = "Choose a mode of payment.";
        payError.hidden = false;
        return;
    }
    if (info.mobile && payNumber.value.replace(/\D/g, "").length < 10) {
        payError.innerText = "Enter a valid mobile number.";
        payError.hidden = false;
        return;
    }

    var total = document.getElementById("pay-total").innerText;
    var orderNo = "AL" + Math.floor(10000 + Math.random() * 90000);
    document.getElementById("pay-done-text").innerText =
        "Order " + orderNo + " is placed. Total \u20B1" + total + ", paid by " + info.label + ".";
    payForm.hidden = true;
    document.getElementById("pay-done").hidden = false;

    cart = [];
    saveCart();
    renderCart();
};

document.getElementById("pay-cancel").onclick = function () { payBox.close(); };
document.getElementById("pay-close").onclick = function () { payBox.close(); };
payBox.onclick = function (e) { if (e.target === payBox) payBox.close(); };

// contact form (contact page only): shows a thank-you note, not sent anywhere yet
var form = document.getElementById("contact-form");
if (form) {
    form.onsubmit = function (e) {
        e.preventDefault();
        document.getElementById("form-note").hidden = false;
        this.reset();
    };
}

// menu button for mobile
document.getElementById("menu-toggle").onclick = function () {
    var open = document.getElementById("menu").classList.toggle("open");
    this.setAttribute("aria-expanded", open);
};

// sign in: the account icon opens a sign-in window
var signin = document.getElementById("signin");
var accountBtn = document.getElementById("open-account");
var user = null;
try { user = JSON.parse(localStorage.getItem("alash-user")); } catch (e) { user = null; }

function updateAccount() {
    accountBtn.classList.toggle("in", !!user);
    accountBtn.setAttribute("aria-label", user ? "Account: " + user.email : "Sign in");
}

accountBtn.onclick = function () {
    document.getElementById("signin-form").hidden = !!user;
    document.getElementById("signed").hidden = !user;
    document.getElementById("si-error").hidden = true;
    if (user) { document.getElementById("si-name").innerText = user.email; }
    signin.showModal();
};

document.getElementById("signin-form").onsubmit = function (e) {
    e.preventDefault();
    var email = document.getElementById("si-email").value.trim();
    var pass = document.getElementById("si-pass").value;
    var error = document.getElementById("si-error");
    if (pass.length < 6) {
        error.innerText = "Password must be at least 6 characters.";
        error.hidden = false;
        return;
    }

    user = { email: email };
    try { localStorage.setItem("alash-user", JSON.stringify(user)); } catch (err) {}
    this.reset();
    updateAccount();
    signin.close();
};

document.getElementById("si-out").onclick = function () {
    user = null;
    try { localStorage.removeItem("alash-user"); } catch (err) {}
    updateAccount();
    signin.close();
};

document.getElementById("si-cancel").onclick = function () { signin.close(); };
document.getElementById("si-close").onclick = function () { signin.close(); };

signin.onclick = function (e) { if (e.target === signin) signin.close(); };

updateAccount();

// footer links: "My Account" opens the account window, "My Order" opens the cart
document.getElementById("footer-account").onclick = function (e) {
    e.preventDefault();
    accountBtn.click();
};
document.getElementById("footer-order").onclick = function (e) {
    e.preventDefault();
    openCart();
};

// show the saved cart as soon as any page loads
renderCart();
renderWishlist();
syncHearts();
