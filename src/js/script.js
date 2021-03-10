/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
  'use strict';

  const select = {
    templateOf: {
      menuProduct: '#template-menu-product',
      cartProduct: '#template-cart-product', // CODE ADDED
    },
    containerOf: {
      menu: '#product-list',
      cart: '#cart',
    },
    all: {
      menuProducts: '#product-list > .product',
      menuProductsActive: '#product-list > .product.active',
      formInputs: 'input, select',
    },
    menuProduct: {
      clickable: '.product__header',
      form: '.product__order',
      priceElem: '.product__total-price .price',
      imageWrapper: '.product__images',
      amountWidget: '.widget-amount',
      cartButton: '[href="#add-to-cart"]',
    },
    widgets: {
      amount: {
        input: 'input.amount', // CODE CHANGED
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
    // CODE ADDED START
    cart: {
      productList: '.cart__order-summary',
      toggleTrigger: '.cart__summary',
      totalNumber: '.cart__total-number',
      totalPrice: '.cart__total-price strong, .cart__order-total .cart__order-price-sum strong',
      subtotalPrice: '.cart__order-subtotal .cart__order-price-sum strong',
      deliveryFee: '.cart__order-delivery .cart__order-price-sum strong',
      form: '.cart__order',
      formSubmit: '.cart__order [type="submit"]',
      phone: '[name="phone"]',
      address: '[name="address"]',
    },
    cartProduct: {
      amountWidget: '.widget-amount',
      price: '.cart__product-price',
      edit: '[href="#edit"]',
      remove: '[href="#remove"]',
    },
    // CODE ADDED END
  };

  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },
    // CODE ADDED START
    cart: {
      wrapperActive: 'active',
    },
    // CODE ADDED END
  };

  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 1,
      defaultMax: 9,
    }, // CODE CHANGED
    // CODE ADDED START
    cart: {
      defaultDeliveryFee: 20,
    },
    // CODE ADDED END
    db: {
      url: '//localhost:3131',
      product: 'product',
      order: 'order',
    },
  };

  const templates = {
    menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
    // CODE ADDED START
    cartProduct: Handlebars.compile(document.querySelector(select.templateOf.cartProduct).innerHTML),
    // CODE ADDED END
  };

  class Product{
    constructor(id, data){
      const thisProduct = this;

      thisProduct.id = id;
      thisProduct.data = data;

      thisProduct.renderInMenu();
      thisProduct.getElements();
      thisProduct.initAccordion();
      thisProduct.initOrderForm();
      thisProduct.initAmountWidget();
      thisProduct.processOrder();

      //console.log('new Product:', thisProduct);
    }

    renderInMenu(){
      const thisProduct = this;

      /* Generate HTML based on template */
      const generatedHTML = templates.menuProduct(thisProduct.data);

      /* create element using utils.createElementFromHTML */
      thisProduct.element = utils.createDOMFromHTML(generatedHTML);

      /* find menu container */
      const menuContainer = document.querySelector(select.containerOf.menu);

      /* add element to menu */
      menuContainer.appendChild(thisProduct.element);

    }

    getElements(){
      const thisProduct = this;

      thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
      thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);
      thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs);
      thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
      thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
      thisProduct.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
      thisProduct.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);
      //console.log(thisProduct.amountWidgetElem);
    }

    initAccordion(){
      const thisProduct = this;

      /* find the clickable trigger (the element that should react to clicking) */
      //const clickableTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);

      //console.log(clickableTrigger);

      /* START: add event listener to clickable trigger on event click */
      thisProduct.accordionTrigger.addEventListener('click', function(event) {

        /* prevent default action for event */
        event.preventDefault();

        /* find active product (product that has active class) */
        const activeProduct = document.querySelector(select.all.menuProductsActive);

        //console.log(activeProduct);

        /* if there is active product and it's not thisProduct.element, remove class active from it */
        if (activeProduct !== null && activeProduct !== thisProduct.element){
          activeProduct.classList.remove('active');
        }

        /* toggle active class on thisProduct.element */
        thisProduct.element.classList.toggle('active');

      });

    }

    initOrderForm(){
      const thisProduct = this;

      //console.log('initOrderForm');

      thisProduct.form.addEventListener('submit', function(event){
        console.log('submit');
        event.preventDefault();
        thisProduct.processOrder();
      });

      for(let input of thisProduct.formInputs){
        input.addEventListener('change', function(){
          thisProduct.processOrder();
        });
      }

      thisProduct.cartButton.addEventListener('click', function(event){
        event.preventDefault();
        thisProduct.processOrder();
        thisProduct.addToCart();
      });
    }

    processOrder() {
      const thisProduct = this;

      // covert form to object structure e.g. { sauce: ['tomato'], toppings: ['olives', 'redPeppers']}
      const formData = utils.serializeFormToObject(thisProduct.form);
      //console.log('formData', formData);

      // set price to default price
      let price = thisProduct.data.price;

      // for every category (param)...
      for(let paramId in thisProduct.data.params) {

        // determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
        const param = thisProduct.data.params[paramId];
        //console.log(paramId, param);

        // for every option in this category
        for(let optionId in param.options) {

          //Find image in image wrapper
          const image = thisProduct.imageWrapper.querySelector('.'  + paramId + '-' + optionId);

          // determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }
          const option = param.options[optionId];
          //console.log(optionId, option);

          // check if formData contains optionId
          if(formData[paramId] && formData[paramId].includes(optionId)) {

            //If option is checked add active class for img
            if(image !== null) {
              //console.log(image.classList);
              image.classList.add(classNames.menuProduct.imageVisible);
            }

            //If option is not default and is checked add option price to price
            if(!option.default == true) {
              price = price + option.price;
            }

          } else{
            //If option is not checked remove active class from img
            if(image !== null) {
              image.classList.remove(classNames.menuProduct.imageVisible);
            }

            //If option is default and is unchecked decrease product price
            if(option.default == true) {
              price = price - option.price;
            }

          }

        }

      }

      //multiply price by amount
      price *= thisProduct.amountWidget.value;

      // update calculated price in the HTML
      thisProduct.priceMulti = price;
      thisProduct.priceElem.innerHTML = price;

    }

    initAmountWidget(){
      const thisProduct = this;

      thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);

      thisProduct.amountWidgetElem.addEventListener('updated', function(){
        thisProduct.processOrder();
      });
    }

    addToCart(){
      const thisProduct = this;

      app.cart.add(thisProduct.prepareCartProduct());
    }

    prepareCartProduct(){
      const thisProduct = this;

      const productSummary = {
        id: thisProduct.id,
        name: thisProduct.data.name,
        amount: thisProduct.amountWidget.value,
        priceSingle: thisProduct.data.price,
        price: thisProduct.priceMulti,
        params: thisProduct.prepareCartProductParams(),
      };

      //console.log(productSummary);

      return productSummary;
    }

    prepareCartProductParams(){//obiekt z opcjami
      const thisProduct = this;
  
      const formData = utils.serializeFormToObject(thisProduct.form);
      
      const params ={};
      
      //for vry category (param)
      for(let paramId in thisProduct.data.params) {

        const param = thisProduct.data.params[paramId];
        //create category param in params const eg. params = {ingidients: {name: 'Ingridients', options: {}}}
        params[paramId] = {
          name: param.label,
          options:{}
        };
        // for every option in this category
        
        for(let optionId in param.options) {
          
          const option = param.options[optionId];
          
          const optionSelected = formData[paramId] && formData[paramId].includes(optionId);

          if(optionSelected){

            params[paramId].options[optionId] = option.label; 
          }

        }

      }
          
      return params;          

    }

      

  }

  class AmountWidget{
    constructor(element){
      const thisWidget = this;

      thisWidget.getElements(element);

      thisWidget.value = settings.amountWidget.defaultValue;

      thisWidget.setValue(thisWidget.input.value);

      thisWidget.initActions();

      //console.log('AmountWidget:', thisWidget);
      //console.log('constructor arguments:', element);
    }

    getElements(element){
      const thisWidget = this;

      thisWidget.element = element;
      thisWidget.input = thisWidget.element.querySelector(select.widgets.amount.input);
      thisWidget.linkDecrease = thisWidget.element.querySelector(select.widgets.amount.linkDecrease);
      thisWidget.linkIncrease = thisWidget.element.querySelector(select.widgets.amount.linkIncrease);
    }

    setValue(value){
      const thisWidget = this;

      const newValue = parseInt(value);

      /*TODO: Add validation*/

      if(thisWidget.value !== newValue && !isNaN(newValue) && newValue >= settings.amountWidget.defaultMin && newValue <= settings.amountWidget.defaultMax) {

        thisWidget.value = newValue;
      }

      thisWidget.input.value = thisWidget.value;
      thisWidget.announce();
    }

    initActions(){
      const thisWidget = this;

      thisWidget.input.addEventListener('change', function(){

        thisWidget.setValue(thisWidget.input.value);
      });

      thisWidget.linkDecrease.addEventListener('click', function(event) {

        event.preventDefault();

        thisWidget.setValue(thisWidget.value - 1);
      });

      thisWidget.linkIncrease.addEventListener('click', function(event) {

        event.preventDefault();

        thisWidget.setValue(thisWidget.value + 1);
      });
    }

    announce(){

      const thisWidget = this;

      //const event = new Event('updated');event emitowany na pojedynczym produkcie bedzie emitowany tez na innych (babelkuje)
      const event = new Event('updated', {
        bubbles: true
      });
      thisWidget.element.dispatchEvent(event);
    }
  }

  class Cart{
    constructor(element) {
      const thisCart = this;

      thisCart.products = [];

      thisCart.getElements(element);

      thisCart.initActions();

      //console.log('new Cart', thisCart);
    }

    getElements(element){
      const thisCart = this;

      thisCart.dom = {};

      thisCart.dom.wrapper = element;
      thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);
      thisCart.dom.productList = thisCart.dom.wrapper.querySelector(select.cart.productList);
      thisCart.dom.deliveryFee = thisCart.dom.wrapper.querySelector(select.cart.deliveryFee);
      thisCart.dom.subtotalPrice = thisCart.dom.wrapper.querySelector(select.cart.subtotalPrice);
      thisCart.dom.totalPrice = thisCart.dom.wrapper.querySelectorAll(select.cart.totalPrice);
      thisCart.dom.totalNumber = thisCart.dom.wrapper.querySelector(select.cart.totalNumber);
      thisCart.dom.form = thisCart.dom.wrapper.querySelector(select.cart.form);
      thisCart.dom.phone = thisCart.dom.wrapper.querySelector(select.cart.phone);
      thisCart.dom.address= thisCart.dom.wrapper.querySelector(select.cart.address);
      
    }

    initActions(){
      const thisCart = this;

      thisCart.dom.toggleTrigger.addEventListener('click', function(event){
        event.preventDefault();

        thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
      });
      thisCart.dom.productList.addEventListener('updated', function(){
        thisCart.update();
      });
      thisCart.dom.productList.addEventListener('remove', function(event){
        thisCart.remove(event.detail.cartProduct);
      });
      thisCart.dom.form.addEventListener('submit', function(event) {
        event.preventDefault();
        thisCart.sendOrder();
      });

      
    }

    add(menuProduct){

      const thisCart = this;
      
      //create HTML code
      const generatedHTML = templates.cartProduct(menuProduct);

      //change html code to DOM element
      const generatedDOM = utils.createDOMFromHTML(generatedHTML);

      //add DOM element to thisCart.dom.productList
      thisCart.dom.productList.appendChild(generatedDOM);
      //console.log('adding product', menuProduct);

      thisCart.products.push(new CartProduct(menuProduct, generatedDOM));
      //console.log('thisCart.products', thisCart.products);
      thisCart.update();

    }

    update() {
      const thisCart = this;

      thisCart.deliveryFee = settings.cart.defaultDeliveryFee;
      thisCart.totalNumber = 0;
      thisCart.subtotalPrice = 0;

      for(let product of thisCart.products) {
        thisCart.totalNumber += product.amount;
        thisCart.subtotalPrice += product.price;
      }
      if(thisCart.totalNumber !== 0) {
        thisCart.totalPrice = thisCart.subtotalPrice + thisCart.deliveryFee;
      } else {
        thisCart.deliveryFee = 0;
        thisCart.subtotalPrice = 0;
      }
      thisCart.dom.subtotalPrice.innerHTML = thisCart.subtotalPrice;
      thisCart.dom.deliveryFee.innerHTML = thisCart.deliveryFee;
      thisCart.dom.totalNumber.innerHTML = thisCart.totalNumber;
      for(let price of thisCart.dom.totalPrice){
        price.innerHTML = thisCart.totalPrice;
      }

    }
    
    remove(cartProduct) {
      const thisCart = this;
      //find an index of element
      const productIndex = thisCart.products.indexOf(cartProduct);
      thisCart.products.splice(productIndex, 1);
      //remove info about specific product from the basket
      cartProduct.dom.wrapper.remove();
      
      thisCart.update();

    }

    sendOrder(){
      const thisCart = this;
      const url = settings.db.url + '/' + settings.db.order;

      thisCart.payload = {
        address: thisCart.dom.address.value,
        phone: thisCart.dom.phone.value,
        totalPrice: thisCart.totalPrice,
        subtotalPrice: thisCart.subtotalPrice,
        totalNumber: thisCart.totalNumber,
        deliveryFee: thisCart.deliveryFee,
        products:[]
      };

      for (let prod of thisCart.products){
        console.log(prod);
        this.payload.products.push(prod);
      }

      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(thisCart.payload),
      };
      fetch(url, options)
        .then(function(response){
          return response.json();
        }).then(function(parsedResponse){
          console.log('parsedResponse', parsedResponse);
        });

    }


  }

  class CartProduct {
    constructor(menuProduct, element) {

      const thisCartProduct = this;

      thisCartProduct.id = menuProduct.id;
      thisCartProduct.name = menuProduct.name;
      thisCartProduct.amount = menuProduct.amount;
      thisCartProduct.price = menuProduct.price;
      thisCartProduct.priceSingle = menuProduct.priceSingle;
      thisCartProduct.params = menuProduct.params;
      thisCartProduct.getElements(element);
      thisCartProduct.initAmountWidget();
      thisCartProduct.initActions();

    }

    getElements(element) {
      const thisCartProduct = this;

      thisCartProduct.dom = {};

      thisCartProduct.dom.wrapper = element;
      thisCartProduct.dom.price = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.price);
      thisCartProduct.dom.edit = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.edit);
      thisCartProduct.dom.amountWidget = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.amountWidget);
      thisCartProduct.dom.remove = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.remove);
    }

    initAmountWidget(){
      const thisCartProduct = this;

      thisCartProduct.amountWidget = new AmountWidget(thisCartProduct.dom.amountWidget);

      thisCartProduct.dom.amountWidget.addEventListener('updated', function(){
        thisCartProduct.amount = thisCartProduct.amountWidget.value;
        thisCartProduct.price = thisCartProduct.amount * thisCartProduct.priceSingle;
        thisCartProduct.dom.price.innerHTML = thisCartProduct.price;
      });
    }

    remove() {
      const thisCartProduct = this;

      const event = new CustomEvent('remove', {
        bubbles: true,
        detail: {
          cartProduct: thisCartProduct,
        },
      });

      thisCartProduct.dom.wrapper.dispatchEvent(event);
    }


    initActions() {
      const thisCartProduct = this;

      thisCartProduct.dom.edit.addEventListener('click', function(event){
        event.preventDefault();
      });
      thisCartProduct.dom.remove.addEventListener('click', function(event){
        event.preventDefault();
        thisCartProduct.remove();
      });
    }
  }
  



  const app = {
    initMenu: function(){
      const thisApp = this;

      //console.log('thisApp.data:', thisApp.data);

      for(let productData in thisApp.data.products){
        new Product(thisApp.data.products[productData].id, thisApp.data.products[productData]);
      }
    },

    initData: function(){
      const thisApp = this;

      thisApp.data = {};
      const url = settings.db.url + '/' + settings.db.product;//adres endpointu

      fetch(url)
        .then(function(rawResponse){
          return rawResponse.json();
        })
        .then(function(parsedResponse){
          console.log('parsedResponse', parsedResponse);
          thisApp.data.products = parsedResponse;
          app.initMenu();
        });
      console.log('thisApp.data', JSON.stringify(thisApp.data));

    },

    

    initCart: function(){
      const thisApp = this;

      const cartElem = document.querySelector(select.containerOf.cart);//div w ktorym jest koszyk
      thisApp.cart = new Cart(cartElem);//instancja klasy cart
    },

    init: function(){
      const thisApp = this;
      //console.log('*** App starting ***');
      //console.log('thisApp:', thisApp);
      //console.log('classNames:', classNames);
      //console.log('settings:', settings);
      //console.log('templates:', templates);

      thisApp.initData();
      //thisApp.initMenu();
      thisApp.initCart();
    },

  };

  app.init();
}