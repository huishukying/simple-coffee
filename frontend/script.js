document.addEventListener('DOMContentLoaded', function() {
    // hamburger menu
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');

    if (hamburger && navLinks) {
        console.log("Hamburger menu found");

        hamburger.addEventListener('click', function() {
            console.log('Hamburger clicked!');
            this.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
    }
    let cart = []

    const savedCart = localStorage.getItem('coffeeCart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        console.log('Loaded saved cart: ', cart.length, 'items');
    }

    updateCartDisplay();

    const buttons = document.querySelectorAll('.add-to-cart-btn');
    console.log('Found', buttons.length, 'coffee buttons');

    buttons.forEach(function(button) {
        button.addEventListener('click', function() {
            const coffeeCard = this.closest('.coffee-card');
            const coffeeName = coffeeCard.dataset.name;
            const coffeePrice = parseFloat(coffeeCard.dataset.price);

            let existingItem = null;
            for (let i = 0; i < cart.length; i++) {
                if (cart[i].name === coffeeName) {
                    existingItem = cart[i];
                    break;
                }
            }

            if (existingItem) {
                existingItem.quantity = existingItem.quantity + 1;
            } else {
                cart.push({
                    name: coffeeName,
                    price: coffeePrice,
                    quantity: 1
                });
            }
            
            updateCartDisplay();

            alert('Added: ' + coffeeName);
        });
    });

    function updateCartDisplay() {
        const cartItemsDiv = document.getElementById('cart-items');
        const cartTotalSpan = document.getElementById('cart-total');

        if (cart.length === 0) {
            cartItemsDiv.innerHTML = '<p> Your cart is empty</p>';
            cartTotalSpan.textContent = '$0.00';

            updateCheckoutPreview();
            localStorage.setItem('coffeeCart', JSON.stringify(cart));
            return;
        }

        let total = 0;
        let itemsHTML = '<ul class="cart-list">';

        for (let i= 0; i < cart.length; i++) {
            const item = cart[i];
            const itemTotal = item.price * item.quantity;

            total += itemTotal;

            itemsHTML += 
            '<li class="cart-item" data-item-index="' + i + '">' +
            '<span class="cart-item-name">' + item.name + '</span>' +
            '<div class="cart-item-controls">' +
            '<button class="decrease-btn" data-name="' + item.name + '">-</button>' +
            '<span class="cart-item-quantity">' + item.quantity + '</span>' +
            '<button class="increase-btn" data-name="' + item.name + '">+</button>' + '</div>' +
            '<span class="cart-item-price">$' + itemTotal.toFixed(2) + '</span>' +
            '<button class="remove-item-btn" data-name="' + item.name + '">Remove</button>' +
            '</li>';

        }

        itemsHTML = itemsHTML + '</ul>';

        cartItemsDiv.innerHTML = itemsHTML;
        cartTotalSpan.textContent = '$' + total.toFixed(2);

        const removeButtons = document.querySelectorAll('.remove-item-btn');

        removeButtons.forEach(function(button) {
            button.addEventListener('click', function() {
            const itemName = this.dataset.name;
            removeItem(itemName);
            });
        });

        const decreaseButtons = document.querySelectorAll('.decrease-btn');
        decreaseButtons.forEach(function(button) {
            button.addEventListener('click', function() {
                const itemName = this.dataset.name;
                updateQuantity(itemName, -1);
            });
            
        });

        const increaseButtons = document.querySelectorAll('.increase-btn');
        increaseButtons.forEach(function(button) {
            button.addEventListener('click', function() {
                const itemName = this.dataset.name;
                updateQuantity(itemName, 1);
            });
        });

        console.log('Cart updated. Total:', total.toFixed(2));
        updateCheckoutPreview();

        localStorage.setItem('coffeeCart', JSON.stringify(cart));
    }

    function updateQuantity(itemName, change) {
        for (let i = 0; i < cart.length; i++) {
            if (cart[i].name === itemName) {
                const newQuantity = cart[i].quantity + change;

                if (newQuantity <= 0) {
                    cart.splice(i, 1);
                } else {
                    cart[i].quantity = newQuantity;
                }
                break;
            }
        }
        updateCartDisplay();
    }

    function removeItem(itemName) {
        console.log('Removing item:', itemName);
        for (let i = 0; i < cart.length; i++) {
            if (cart[i].name === itemName) {
                cart.splice(i, 1);
                break;
            } 
        }
        updateCartDisplay();
        alert('Removed: ' + itemName);
    }


    const clearCartBtn = document.getElementById('clear-cart-btn');

    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', function() {
            if (cart.length > 0) {
                if (confirm('Are you sure to clear your entire order?')) {
                    cart = [];
                    updateCartDisplay();
                    localStorage.removeItem('coffeeCart');
                    alert('Cart cleared!');
                }
            } else {
                alert('Your cart is already empty!');
            }
        });
    }

    function updateCheckoutPreview() {
        const checkoutItemsDiv = document.getElementById('checkout-items');
        const checkoutTotalSpan = document.getElementById('checkout-total');
    
        if (!checkoutItemsDiv) return;

        if (cart.length === 0) {
            checkoutItemsDiv.innerHTML = '<p> No items in cart</p>';
            checkoutTotalSpan.innerHTML = '<strong>Total: $0.00</strong>';
            return;
        }

        let total = 0;
        let itemsHTML = '';

        for (let i = 0; i < cart.length; i++) {
            const item = cart[i];
            const itemTotal = item.price * item.quantity;
            total += itemTotal;

        itemsHTML += `
            <div class="checkout-item">
            <span>${item.name} x${item.quantity}</span>
            <span>$${itemTotal.toFixed(2)}</span>
            </div>`;
        }

        checkoutItemsDiv.innerHTML = itemsHTML;
        checkoutTotalSpan.innerHTML = `<strong>Total: $${total.toFixed(2)}</strong>`;
    }


    function showConfirmation(name, total) {
        const confirmationDiv = document.createElement('div');
        confirmationDiv.className = 'confirmation-popup';

         
    

        confirmationDiv.innerHTML = `
            <div class="confirmation-content">
                <div class="confirmation-icon">✅</div>
                <h3>Order Confirmed!</h3>
                <p>Thank you, ${name}!</p>
                <p>Total: <strong>$${total.toFixed(2)}</strong></p>
                <button class="close-confirmation">Close</button>
            </div>
        `;

        document.body.appendChild(confirmationDiv);

        const closeBtn = confirmationDiv.querySelector('.close-confirmation'); 
        
        closeBtn.addEventListener('click', function() {
            confirmationDiv.remove();
        });

    }

    const checkoutForm = document.getElementById('checkout-form');

    if (checkoutForm) {
        checkoutForm.addEventListener('submit', function(event) {
            event.preventDefault();

            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const address = document.getElementById('address').value;
            const district = document.getElementById('district').value;
            const region = document.getElementById('region').value;


            let errors = [];

            if (name === '') errors.push('Please enter your name');
            if (email === '') errors.push('Please enter your email');
            if (address === '') errors.push('Please enter your address');
            if (district === '') errors.push('Please enter your district');
            if (region === '') errors.push('Please enter your region');
            if (cart.length === 0) errors.push('Your cart is empty.');
            
            if (errors.length > 0) {
                alert(errors.join('\n'));
            } else {
                let total = 0;
                for (let i = 0; i < cart.length; i++) {
                    total += cart[i].price * cart[i].quantity;
                }

                const orderData = {
                    customer_name: name,
                    customer_email: email,
                    customer_address: address + ', ' + district + ', ' + region,
                    items: cart.map(item => ({
                        name: item.name,
                        quantity: item.quantity,
                        price: item.price
                    })),
                    total_amount: total,
                    order_date: new Date().toISOString()
                };

                console.log('Sending order to backend:', orderData);

                fetch('http://localhost:8001/api/orders', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(orderData)
                })
                .then(response => {
                    console.log('Response status:', response.status);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Backend response:', data);
                    alert(`Order placed successfully! Order #${data.order_id}`);
                
                    showConfirmation(name, total);

                    cart = [];
                    updateCartDisplay();
                    updateCheckoutPreview();
                    localStorage.removeItem('coffeeCart');

                    document.getElementById('name').value = '';
                    document.getElementById('email').value = '';
                    document.getElementById('phone').value = '';
                    document.getElementById('address').value = '';
                    document.getElementById('district').value = '';
                    document.getElementById('region').value = '';
                })
                .catch(error => {
                    console.error('Error: ', error);
                    alert('Error connecting to backend. \nBut your order has been saved locally. ')

                    showConfirmation(name, total);

                    cart = [];
                    updateCartDisplay();
                    updateCheckoutPreview();
                    localStorage.removeItem('coffeeCart');

                    document.getElementById('name').value = '';
                    document.getElementById('email').value = '';
                    document.getElementById('phone').value = '';
                    document.getElementById('address').value = '';
                    document.getElementById('district').value = '';
                    document.getElementById('region').value = '';
                })

            }
        });
    }
    const viewOrdersBtn = document.getElementById('view-orders-btn');
    if (viewOrdersBtn) {
        viewOrdersBtn.addEventListener('click', function() {
            fetch('http://localhost:8001/api/orders')
            .then(response => response.json())
            .then(data => {
                console.log('All orders: ', data);
                alert(`Total orders: ${data.count}\nCheck console for details`);
            })
            .catch(error => {
                console.error('Error fetching orders: ', error);
                alert('Could not fetch orders');
            });
        });
    }

});

