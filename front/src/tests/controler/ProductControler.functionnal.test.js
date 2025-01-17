/**
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom';
import { getByLabelText, getByText, queries } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { ProductControler } from '../../js/controler/ProductControler';
import { ProductManagerKanapApi } from '../../js/model/ProductManagerKanapApi';
import { CONFIG_TEST } from '../data/mocked-configuration';
import { MOCKED_API_DATA } from '../data/mockedApiData';
import { MOCKED_PRODUCT_ENTITY_DATA } from '../data/mockedProductEntityData';
import { MOCKED_CART_DATA } from '../data/mockedCartData';
import { Product } from '../../js/entity/Product';

describe('ProductControler Functionnal Test Suite', () => {
    const testUrl = 'http://localhost/product.html?id=' + MOCKED_API_DATA[2]._id;
    delete window.location;
    window.location = new URL(testUrl);
    let controlerTest;

    global.fetch = jest.fn().mockImplementation();
    const consoleMock = jest.spyOn(global.console, 'error');
    const alertMock = jest.spyOn(window, 'alert');

    beforeEach(() => {
        window.location.href = testUrl;
        controlerTest = new ProductControler(CONFIG_TEST);

        global.fetch.mockReset();
        consoleMock.mockReset();
        alertMock.mockReset();

        document.body.innerHTML = '';

        const imageContainerElt = document.createElement('div');
        imageContainerElt.classList.add('item__img');

        const titleElt = document.createElement('h1');
        titleElt.id = 'title';

        const priceContainerElt = document.createElement('p');
        const priceElt = document.createElement('span');
        priceElt.id = 'price';

        const descriptionElt = document.createElement('p');
        descriptionElt.id = 'description';

        const quantityInputElt = document.createElement('input');
        quantityInputElt.type = 'number';
        quantityInputElt.id = 'quantity';
        quantityInputElt.min = 1;
        quantityInputElt.max = 100;
        quantityInputElt.value = 0;
        const quantityLabel = document.createElement('label');
        quantityLabel.textContent = 'Quantity';
        quantityLabel.setAttribute('for', 'quantity');

        const selectElt = document.createElement('select');
        selectElt.id = 'colors';
        const optionElt = document.createElement('option');
        const colorLabel = document.createElement('label');
        colorLabel.textContent = 'Color';
        colorLabel.setAttribute('for', 'colors');

        const addToCartButton = document.createElement('button');
        addToCartButton.textContent = 'Add to cart';
        addToCartButton.id = 'addToCart';

        document.body.appendChild(imageContainerElt);
        document.body.appendChild(titleElt);
        priceContainerElt.appendChild(priceElt);
        document.body.appendChild(priceContainerElt);
        document.body.appendChild(descriptionElt);
        document.body.appendChild(quantityLabel);
        document.body.appendChild(quantityInputElt);
        document.body.appendChild(colorLabel);
        selectElt.appendChild(optionElt);
        document.body.appendChild(selectElt);
        document.body.appendChild(addToCartButton);
    });

    describe('initialize() Method Test Suite', () => {
        beforeEach(() => {
            controlerTest.productManager.productsListComplete = false;
            controlerTest.productManager.products = [];
        });

        it("should display the product's informations", async () => {
            global.fetch.mockResolvedValue({
                json: () => Promise.resolve(MOCKED_API_DATA[0]),
                ok: true,
            });

            await controlerTest.initialize();

            const imageElt = document.querySelector('.item__img img');
            const titleElt = document.getElementById('title');
            const priceElt = document.getElementById('price');
            const descriptionElt = document.getElementById('description');
            const selectElt = document.getElementById('colors');
            const optionElts = document.querySelectorAll('#colors option');

            expect(imageElt).toBeDefined();
            expect(imageElt).toHaveAttribute('src', MOCKED_API_DATA[0].imageUrl);
            expect(imageElt).toHaveAttribute('alt', MOCKED_API_DATA[0].altTxt);
            expect(titleElt).toHaveTextContent(MOCKED_API_DATA[0].name);
            expect(priceElt).toHaveTextContent(MOCKED_API_DATA[0].price);
            expect(descriptionElt).toHaveTextContent(MOCKED_API_DATA[0].description);
            for (let i = 1; i < optionElts.length; i++) {
                expect(selectElt).toContainElement(optionElts[i]);
                expect(optionElts[i]).toHaveAttribute('value', MOCKED_API_DATA[0].colors[i - 1]);
                expect(optionElts[i]).toHaveTextContent(MOCKED_API_DATA[0].colors[i - 1]);
            }
        });

        it('should save the data to the manager', async () => {
            global.fetch.mockResolvedValue({
                json: () => Promise.resolve(MOCKED_API_DATA[0]),
                ok: true,
            });

            await controlerTest.initialize();

            expect(controlerTest.productManager.products).toContainEqual(MOCKED_PRODUCT_ENTITY_DATA[0]);
        });

        it('should alert and print an error if an error occurs while fetching the data', async () => {
            const error = new Error('Error while fetching');
            global.fetch.mockRejectedValue(error);

            await controlerTest.initialize();

            expect(consoleMock).toHaveBeenCalled();
            expect(alertMock).toHaveBeenCalled();
        });

        it('should alert and print an error if there is no product id in the url', async () => {
            window.location.href = testUrl.replace(/\?id=.*$/, '');
            const controlerTestUrlError = new ProductControler(CONFIG_TEST);
            global.fetch.mockResolvedValue({
                json: () => Promise.resolve(MOCKED_API_DATA[0]),
                ok: true,
            });

            await controlerTestUrlError.initialize();

            expect(consoleMock).toHaveBeenCalled();
            expect(alertMock).toHaveBeenCalled();
        });
    });

    describe('Add to cart Event Test Suite', () => {
        const cartExample = MOCKED_CART_DATA.cartData.slice(0, 3);

        beforeEach(async () => {
            global.fetch.mockResolvedValue({
                json: () => Promise.resolve(MOCKED_API_DATA[2]),
                ok: true,
            });
            await controlerTest.initialize();
        });

        it('should alert an error if the color is not selected', () => {
            userEvent.type(getByLabelText(document.body, 'Quantity'), '10');
            userEvent.click(getByText(document.body, 'Add to cart'));
            expect(document.getElementById('colors').nextElementSibling).toHaveClass('error');
        });

        it('should alert an error if the quantity is invalid', () => {
            userEvent.selectOptions(
                getByLabelText(document.body, 'Color'),
                getByText(document.body, MOCKED_API_DATA[2].colors[0])
            );
            userEvent.type(getByLabelText(document.body, 'Quantity'), '-3');
            userEvent.click(getByText(document.body, 'Add to cart'));
            expect(document.getElementById('quantity').nextElementSibling).toHaveClass('error');
        });

        it('should remove the error if the fields are valid', () => {
            userEvent.click(getByText(document.body, 'Add to cart'));

            userEvent.selectOptions(
                getByLabelText(document.body, 'Color'),
                getByText(document.body, MOCKED_API_DATA[2].colors[0])
            );
            userEvent.type(getByLabelText(document.body, 'Quantity'), '3');

            userEvent.click(getByText(document.body, 'Add to cart'));

            const errorContainers = document.getElementsByClassName('error');

            expect(errorContainers.length).toBe(0);
        });

        it('should add a new product to the cart', () => {
            localStorage.setItem('cart', JSON.stringify(cartExample));
            const addedProduct = MOCKED_CART_DATA.cartData[3];

            userEvent.selectOptions(
                getByLabelText(document.body, 'Color'),
                getByText(document.body, MOCKED_API_DATA[2].colors[0])
            );
            userEvent.type(getByLabelText(document.body, 'Quantity'), addedProduct.quantity.toString());

            const buttonAddToCart = getByText(document.body, 'Add to cart');
            const eventFreeButton = buttonAddToCart.cloneNode(true);
            buttonAddToCart.parentNode.replaceChild(eventFreeButton, buttonAddToCart);
            eventFreeButton.addEventListener('click', async (e) => {
                await controlerTest.addToCartEventHandler(e);
                expect(JSON.parse(localStorage.getItem('cart'))).toContainEqual(addedProduct);

                const notificationContainer = document.getElementById('notification-container');
                expect(notificationContainer).not.toBeNull();
            });
            userEvent.click(eventFreeButton);
        });

        it('should change the quantity of the same product in the cart', () => {
            const doubleProductCartValue = cartExample.concat(MOCKED_CART_DATA.cartData[3]);
            localStorage.setItem('cart', JSON.stringify(doubleProductCartValue));

            const modifiedProduct = {
                id: MOCKED_CART_DATA.cartData[3].id,
                color: MOCKED_CART_DATA.cartData[3].color,
                quantity: MOCKED_CART_DATA.cartData[3].quantity + 10,
                name: MOCKED_CART_DATA.cartData[3].name,
            };

            userEvent.selectOptions(
                getByLabelText(document.body, 'Color'),
                getByText(document.body, MOCKED_API_DATA[2].colors[0])
            );
            userEvent.type(getByLabelText(document.body, 'Quantity'), '10');

            const buttonAddToCart = getByText(document.body, 'Add to cart');
            const eventFreeButton = buttonAddToCart.cloneNode(true);
            buttonAddToCart.parentNode.replaceChild(eventFreeButton, buttonAddToCart);
            eventFreeButton.addEventListener('click', async (e) => {
                await controlerTest.addToCartEventHandler(e);
                expect(JSON.parse(localStorage.getItem('cart'))).toContainEqual(modifiedProduct);

                const notificationContainer = document.getElementById('notification-container');
                expect(notificationContainer).not.toBeNull();
            });
            userEvent.click(getByText(document.body, 'Add to cart'));
        });

        it("should alert an error if the product can't be found", () => {
            const mockGetProduct = jest.spyOn(controlerTest.productManager, 'getProduct');
            mockGetProduct.mockImplementation(() => {
                throw new Error();
            });
            localStorage.setItem('cart', JSON.stringify(cartExample));

            userEvent.selectOptions(
                getByLabelText(document.body, 'Color'),
                getByText(document.body, MOCKED_API_DATA[2].colors[0])
            );
            userEvent.type(getByLabelText(document.body, 'Quantity'), '10');

            const buttonAddToCart = getByText(document.body, 'Add to cart');
            const eventFreeButton = buttonAddToCart.cloneNode(true);
            buttonAddToCart.parentNode.replaceChild(eventFreeButton, buttonAddToCart);
            eventFreeButton.addEventListener('click', async (e) => {
                await controlerTest.addToCartEventHandler(e);
                expect(alertMock).toHaveBeenCalled();
            });
            userEvent.click(getByText(document.body, 'Add to cart'));
        });
    });
});
