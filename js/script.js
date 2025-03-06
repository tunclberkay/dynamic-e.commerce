$('.navTrigger').click(function () {
    $(this).toggleClass('active');
    console.log("Clicked menu");
    $("#mainListDiv").toggleClass("show_list");
    $("#mainListDiv").fadeIn();
});

// Sepet verilerini tutan bir dizi
let cart = [];

// Sepete ürün ekleme fonksiyonu
function addToCart(productName, price, image) {
    // Ürün sepette zaten var mı kontrol et
    let existingProduct = cart.find(item => item.productName === productName);

    if (existingProduct) {
        // Eğer varsa miktarı artır
        existingProduct.quantity += 1;
    } else {
        // Eğer yoksa yeni ürün olarak ekle
        cart.push({ productName, price, image, quantity: 1 });
    }

    // Sepeti güncelle
    updateCartDisplay();
}

// Sepetteki ürünleri ve toplam fiyatı güncelleme fonksiyonu
function updateCartDisplay() {
    // Sepetteki ürün sayısını güncelle
    let cartBadge = document.getElementById('cart-badge');
    let totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartBadge.textContent = totalItems; // Sepetteki toplam ürün miktarını göster

    // Sepetteki ürünleri ve toplam fiyatı göstermek için HTML elementlerini güncelle
    let cartItems = document.getElementById('cart-items');
    cartItems.innerHTML = ''; // Önceden eklenen öğeleri temizle

    let totalPrice = 0;
    cart.forEach(item => {
        // Ürünleri listele
        let listItem = document.createElement('div');
        listItem.classList.add('cart-item');

        let img = document.createElement('img');
        img.src = item.image;
        listItem.appendChild(img);

        let name = document.createElement('h4');
        name.textContent = item.productName;
        listItem.appendChild(name);

        let quantity = document.createElement('span');
        quantity.textContent = `Adet: ${item.quantity}`;
        listItem.appendChild(quantity);

        let price = document.createElement('span');
        price.classList.add('price');
        price.textContent = `₺${(item.price * item.quantity).toFixed(2)}`;
        listItem.appendChild(price);

        let remove = document.createElement('span');
        remove.classList.add('remove');
        remove.textContent = 'Sil';
        remove.onclick = () => removeItem(item.productName);
        listItem.appendChild(remove);

        cartItems.appendChild(listItem);

        // Toplam fiyatı hesapla
        totalPrice += item.price * item.quantity;
    });

    // Toplam fiyatı güncelle
    let totalPriceElement = document.getElementById('total-price');
    totalPriceElement.textContent = `Toplam: ₺${totalPrice.toFixed(2)}`;
}

// Sepet modalını açma
function openModal() {
    document.getElementById('cart-modal').style.display = "block";
}

// Sepet modalını kapama
function closeModal() {
    document.getElementById('cart-modal').style.display = "none";
}

// Sepet item'ını silme (Miktarı azalt, 0 olursa tamamen çıkar)
function removeItem(productName) {
    let productIndex = cart.findIndex(item => item.productName === productName);

    if (productIndex !== -1) {
        if (cart[productIndex].quantity > 1) {
            cart[productIndex].quantity -= 1;
        } else {
            cart.splice(productIndex, 1);
        }
    }

    updateCartDisplay();
}
//swiper
  var swiper = new Swiper(".mySwiper", {
    slidesPerView: 1,
    spaceBetween: 10,
    loop: true,
    navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
    },
    pagination: {
        el: ".swiper-pagination",
        clickable: true,
    },
});


function toggleMenu() {
    document.querySelector(".nav-links").classList.toggle("active");
}

function searchProducts() {
    let input = document.getElementById('searchBar').value.toLowerCase();
    let products = document.getElementsByClassName('product-card');

    for (let i = 0; i < products.length; i++) {
        let productName = products[i].getElementsByTagName('h3')[0].innerText.toLowerCase();
        
        if (productName.includes(input)) {
            products[i].style.display = "block"; // Eşleşenleri göster
        } else {
            products[i].style.display = "none"; // Eşleşmeyenleri gizle
        }
    }
}

function filterProducts(category) {
    let products = document.querySelectorAll('.product-card');
    
    products.forEach(product => {
        if (category === 'all') {
            product.style.display = 'block'; // Tüm ürünleri göster
        } else {
            // Eğer ürünün kategorisi seçilen kategoriyle eşleşiyorsa göster
            if (product.classList.contains(category)) {
                product.style.display = 'block';
            } else {
                product.style.display = 'none';
            }
        }
    });
}
//son eklenen
document.addEventListener("DOMContentLoaded", async function () {
    let productContainer = document.querySelector(".containerr");

    // Veritabanından ürünleri çek
    let response = await fetch("http://localhost:5002/products");
    let products = await response.json();

    // Kategorileri al (benzersiz kategorileri al)
    let categories = [...new Set(products.map(product => product.category))];

    // Kategori butonları için container'ı seç
    let categoryButtonsContainer = document.querySelector('.category-buttons');
    categoryButtonsContainer.innerHTML = ''; // Mevcut butonları temizle

    // 'Tümü' butonunu ekle
    let allButton = document.createElement('button');
    allButton.textContent = 'Tümü';
    allButton.onclick = () => filterProducts('all');
    categoryButtonsContainer.appendChild(allButton);

    // Kategorilere göre butonları ekle
    categories.forEach(category => {
        let button = document.createElement('button');
        button.textContent = category;
        button.onclick = () => filterProducts(category);  // Seçilen kategoriye göre filtrele
        categoryButtonsContainer.appendChild(button);
    });

    // Ürünleri listeleme işlemi
    products.forEach(product => {
        let productCard = document.createElement("div");
        productCard.classList.add("product-card", product.category);  // Kategorisine göre class ekle

        productCard.innerHTML = `
            <img src="${product.image_url}" alt="${product.name}" width="200" height="200">
            <h3>${product.name}</h3>
            <p>${product.description || "Açıklama bulunmamaktadır."}</p> <!-- Eğer açıklama yoksa varsayılan metin göster -->
            <span class="price">₺${product.price}</span>
            <br>
            <button onclick="addToCart('${product.name}', ${product.price}, '${product.image_url}')">Sepete Ekle</button>
        `;

        productContainer.appendChild(productCard);
    });
});




