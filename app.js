const menu = [
{id:"jollof",name:"Jollof Rice & Grilled Chicken",category:"Mains",price:4500,description:"Smoky party-style rice served with juicy grilled chicken.",image:"https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=900&q=80"},
{id:"suya",name:"Beef Suya Platter",category:"Mains",price:5500,description:"Spiced grilled beef with onions and fresh tomatoes.",image:"https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80"},
{id:"burger",name:"TMAX Signature Burger",category:"Mains",price:4800,description:"A juicy burger with crisp lettuce, cheese, and house sauce.",image:"https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80"},
{id:"pasta",name:"Creamy Chicken Pasta",category:"Mains",price:5200,description:"Comforting pasta tossed in a rich, creamy sauce.",image:"https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=900&q=80"},
{id:"fries",name:"Crispy Potato Fries",category:"Sides",price:1800,description:"Golden, crunchy potato fries with light seasoning.",image:"https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=900&q=80"},
{id:"salad",name:"Fresh Garden Salad",category:"Sides",price:2200,description:"Fresh colourful vegetables with house dressing.",image:"https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80"},
{id:"juice",name:"Fresh Fruit Juice",category:"Drinks",price:1500,description:"A refreshing fruit blend, served chilled.",image:"https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=900&q=80"},
{id:"zobo",name:"Chilled Zobo",category:"Drinks",price:1000,description:"A refreshing Nigerian hibiscus drink, served cold.",image:"https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=900&q=80"},
{id:"cake",name:"Chocolate Cake",category:"Desserts",price:2500,description:"Soft chocolate cake for a sweet finish.",image:"https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=80"}
];
const WHATSAPP_NUMBER = "2348012345678"; // Replace with the real restaurant WhatsApp number.
const money = n => "₦" + Number(n).toLocaleString("en-NG");
let cart = {};
const $ = id => document.getElementById(id);
function renderProducts(category="All") {
  const products = menu.filter(p => category === "All" || p.category === category);
  $("products").innerHTML = products.map(p => `<article class="product"><img loading="lazy" src="${p.image}" alt="${p.name}"><div class="product-body"><div class="product-head"><h3>${p.name}</h3><span class="price">${money(p.price)}</span></div><p>${p.description}</p><button class="add-button" data-add="${p.id}">＋ Add to cart</button></div></article>`).join("");
}
function renderCart() {
  const entries = Object.entries(cart);
  const count = entries.reduce((sum, [,qty]) => sum + qty, 0);
  const total = entries.reduce((sum, [id,qty]) => sum + menu.find(p => p.id === id).price * qty, 0);
  $("cartCount").textContent = count;
  $("cartDrawerTotal").textContent = money(total);
  $("checkoutTotal").textContent = money(total);
  $("cartItems").innerHTML = entries.length ? entries.map(([id,qty]) => {
    const p = menu.find(item => item.id === id);
    return `<div class="cart-item"><div><b>${p.name}</b><small>${money(p.price)} each · ${money(p.price*qty)}</small></div><div class="qty"><button data-qty="${id}" data-delta="-1" aria-label="Remove one">−</button><b>${qty}</b><button data-qty="${id}" data-delta="1" aria-label="Add one">＋</button></div></div>`;
  }).join("") : '<div class="empty-cart">Your cart is empty.<br>Add something delicious from the menu.</div>';
}
function openCart(){ $("cartOverlay").classList.add("open"); $("cartOverlay").setAttribute("aria-hidden","false"); }
function closeCart(){ $("cartOverlay").classList.remove("open"); $("cartOverlay").setAttribute("aria-hidden","true"); }
function showStatus(message, error=false){ $("checkoutStatus").textContent=message; $("checkoutStatus").style.color=error?"#a12626":"#315c40"; }
function getOrderDetails(){
 return {customerName:$("customerName").value.trim(),phone:$("customerPhone").value.trim(),email:$("customerEmail").value.trim(),orderType:$("orderType").value,address:$("customerAddress").value.trim(),notes:$("customerNotes").value.trim(),items:Object.entries(cart).map(([id,quantity])=>({id,quantity}))};
}
$("products").addEventListener("click",e=>{const b=e.target.closest("[data-add]");if(!b)return;cart[b.dataset.add]=(cart[b.dataset.add]||0)+1;renderCart();b.textContent="✓ Added";setTimeout(()=>{if(b.isConnected)b.textContent="＋ Add to cart"},900)});
$("filters").addEventListener("click",e=>{const b=e.target.closest("[data-cat]");if(!b)return;document.querySelectorAll(".filter").forEach(x=>x.classList.toggle("active",x===b));renderProducts(b.dataset.cat)});
$("cartItems").addEventListener("click",e=>{const b=e.target.closest("[data-qty]");if(!b)return;const id=b.dataset.qty;cart[id]=(cart[id]||0)+Number(b.dataset.delta);if(cart[id]<=0)delete cart[id];renderCart()});
$("openCart").addEventListener("click",openCart);$("closeCart").addEventListener("click",closeCart);$("closeCartX").addEventListener("click",closeCart);
$("continueCheckout").addEventListener("click",()=>{closeCart();$("visit").scrollIntoView({behavior:"smooth"});setTimeout(()=>$("customerName").focus({preventScroll:true}),450)});
$("checkoutForm").addEventListener("submit",async e=>{
 e.preventDefault();if(!Object.keys(cart).length){showStatus("Please add at least one item to your cart before checkout.",true);openCart();return}
 const order=getOrderDetails();if(order.orderType==="Delivery"&&!order.address){showStatus("Please enter a delivery address, or choose Pickup.",true);$("customerAddress").focus();return}
 const submit=e.submitter;submit.disabled=true;submit.textContent="Preparing secure checkout…";showStatus("Connecting to secure payment checkout…");
 try {
  const response=await fetch("/api/payments/initialize",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...order,customerName:order.customerName,email:order.email,phone:order.phone})});
  const data=await response.json();if(!response.ok)throw new Error(data.error||"Unable to start checkout.");
  window.location.href=data.authorizationUrl;
 } catch(err) {showStatus(err.message+" You can still use WhatsApp ordering, or contact the restaurant.",true)}
 finally {submit.disabled=false;submit.textContent="Pay securely online ↗"}
});
$("whatsappOrder").addEventListener("click",()=>{
 if(!Object.keys(cart).length){showStatus("Please add food to your cart first.",true);return}
 const o=getOrderDetails();if(!o.customerName||!o.phone||!o.email){showStatus("Please fill in your name, phone number, and email first.",true);return}
 const lines=Object.entries(cart).map(([id,q])=>{const p=menu.find(x=>x.id===id);return `${q} × ${p.name} — ${money(p.price*q)}`});
 const total=Object.entries(cart).reduce((s,[id,q])=>s+menu.find(x=>x.id===id).price*q,0);
 const msg=`Hello TMAX Restaurant! I'd like to place an order:\n\n${lines.join("\n")}\n\nEstimated total: ${money(total)}\nName: ${o.customerName}\nPhone: ${o.phone}\nEmail: ${o.email}\nMethod: ${o.orderType}\nAddress: ${o.address||"Not provided"}\nNotes: ${o.notes||"None"}`;
 if(!WHATSAPP_NUMBER||WHATSAPP_NUMBER==="2348012345678"){showStatus("Please set the real WhatsApp number in public/app.js before using WhatsApp ordering.",true);return}
 window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`,"_blank","noopener");
});
fetch("/api/config").then(r=>r.json()).then(config=>{
 if(!config.paymentsConfigured){$("paymentNotice").textContent="Payments are not active yet. The owner must configure Paystack test/live keys on the server. No card information is collected by this website."}
}).catch(()=>{$("paymentNotice").textContent="Run this site through its Node server to enable checkout APIs. Static preview alone cannot process payments."});
$("year").textContent=new Date().getFullYear();renderProducts();renderCart();
