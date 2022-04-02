/**
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom';
import { getByLabelText, getByText, queries } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';

import { ProductControler } from './ProductControler';
import { CONFIG } from '../config/config';
import { MOCKED_API_DATA } from '../dao/mockedApiData';
import { MOCKED_PRODUCT_ENTITY_DATA } from '../model/mockedProductEntityData';

describe('ProductControler Functionnal Test Suite', () => {
    const testUrl = 'http://localhost/product.html?id=' + MOCKED_API_DATA[0]._id;
    delete window.location;
    window.location = new URL(testUrl);
    let controlerTest;

    global.fetch = jest.fn().mockImplementation();
    const consoleMock = jest.spyOn(global.console, 'error');
    const alertMock = jest.spyOn(window, 'alert');

    beforeEach(() => {
        window.location.href = testUrl;
        controlerTest = new ProductControler(CONFIG);

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
        it("should display the product's informations", async () => {
            global.fetch.mockResolvedValue({
                json: () => Promise.resolve(MOCKED_API_DATA[0]),
                ok: true,
            });
            controlerTest.productManager.productsListComplete = false;
            controlerTest.productManager.products = [];

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
            controlerTest.productManager.productsListComplete = false;
            controlerTest.productManager.products = [];

            await controlerTest.initialize();

            expect(controlerTest.productManager.products).toContainEqual(MOCKED_PRODUCT_ENTITY_DATA[0]);
        });

        it('should alert and print an error if an error occurs while fetching the data', async () => {
            const error = new Error('Error while fetching');
            global.fetch.mockRejectedValue(error);
            controlerTest.productManager.productsListComplete = false;
            controlerTest.productManager.products = [];

            await controlerTest.initialize();

            expect(consoleMock).toHaveBeenCalled();
            expect(alertMock).toHaveBeenCalled();
        });

        it('should alert and print an error if there is no product id in the url', async () => {
            window.location.href = testUrl.replace(/\?id=.*$/, '');
            const controlerTestUrlError = new ProductControler(CONFIG);
            global.fetch.mockResolvedValue({
                json: () => Promise.resolve(MOCKED_API_DATA[0]),
                ok: true,
            });
            controlerTest.productManager.productsListComplete = false;
            controlerTest.productManager.products = [];

            await controlerTestUrlError.initialize();

            expect(consoleMock).toHaveBeenCalled();
            expect(alertMock).toHaveBeenCalled();
        });
    });

    describe('Add to cart Event Test Suite', () => {
        const cartExample = [
            {
                id: '1',
                color: 'blue',
                quantity: 3,
            },
            {
                id: '2',
                color: 'pink',
                quantity: 6,
            },
            {
                id: '3',
                color: 'red',
                quantity: 2,
            },
        ];

        beforeEach(async () => {
            global.fetch.mockResolvedValue({
                json: () => Promise.resolve(MOCKED_API_DATA[0]),
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
                getByText(document.body, MOCKED_API_DATA[0].colors[0])
            );
            userEvent.type(getByLabelText(document.body, 'Quantity'), '-3');
            userEvent.click(getByText(document.body, 'Add to cart'));
            expect(document.getElementById('quantity').nextElementSibling).toHaveClass('error');
        });

        it('should remove the error if the fields are valid', () => {
            userEvent.click(getByText(document.body, 'Add to cart'));

            userEvent.selectOptions(
                getByLabelText(document.body, 'Color'),
                getByText(document.body, MOCKED_API_DATA[0].colors[0])
            );
            userEvent.type(getByLabelText(document.body, 'Quantity'), '3');

            userEvent.click(getByText(document.body, 'Add to cart'));

            const errorContainers = document.getElementsByClassName('error');

            expect(errorContainers.length).toBe(0);
        });

        it('should add a new product to the cart', () => {
            localStorage.setItem('cart', JSON.stringify(cartExample));
            const addedProduct = {
                id: MOCKED_API_DATA[0]._id,
                color: MOCKED_API_DATA[0].colors[0],
                quantity: 10,
            };

            userEvent.selectOptions(
                getByLabelText(document.body, 'Color'),
                getByText(document.body, MOCKED_API_DATA[0].colors[0])
            );
            userEvent.type(getByLabelText(document.body, 'Quantity'), '10');
            userEvent.click(getByText(document.body, 'Add to cart'));

            expect(JSON.parse(localStorage.getItem('cart'))).toContainEqual(addedProduct);

            const notificationContainer = document.getElementById('notification-container');
            expect(notificationContainer).not.toBeNull();
        });

        it('should change the quantity of the same product in the cart', () => {
            const doubleProductCartValue = cartExample.concat({
                id: MOCKED_API_DATA[0]._id,
                color: MOCKED_API_DATA[0].colors[0],
                quantity: 2,
            });
            localStorage.setItem('cart', JSON.stringify(doubleProductCartValue));

            const modifiedProduct = {
                id: MOCKED_API_DATA[0]._id,
                color: MOCKED_API_DATA[0].colors[0],
                quantity: 12,
            };

            userEvent.selectOptions(
                getByLabelText(document.body, 'Color'),
                getByText(document.body, MOCKED_API_DATA[0].colors[0])
            );
            userEvent.type(getByLabelText(document.body, 'Quantity'), '10');
            userEvent.click(getByText(document.body, 'Add to cart'));

            expect(JSON.parse(localStorage.getItem('cart'))).toContainEqual(modifiedProduct);

            const notificationContainer = document.getElementById('notification-container');
            expect(notificationContainer).not.toBeNull();
        });
    });
});
