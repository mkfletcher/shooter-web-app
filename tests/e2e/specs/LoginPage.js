// https://docs.cypress.io/api/introduction/api.html

describe('Login Page Test', () => {

    // Rendirect to login page
    beforeEach(() => {
        cy.visit("/"); 
    });

    // Test entering details
    context("Enter log in details", () => {

        //
        it("should warn me about empty display name", () => {
            cy.get('input[name="userDisplayName"]').clear();
            cy.get('input[name="userDisplayName"]').invoke('val');
            cy.get('#userDisplayNameFeedback').should('have.text', "This is a required field.");
        });
        
        it("should warn me about empty password", () => {
            cy.get('input[name="userPassword"]').clear();
            cy.get('input[name="userPassword"]').invoke('val');
            cy.get('#userPasswordFeedback').should('have.text', "This is a required field.");

        });

        it("should give the display name field the valid class when a display name has been entered", () => {
            cy.get('input[name="userDisplayName"]').clear();
            cy.get('input[name="userDisplayName"]').type("Matt");
            cy.get('input[name="userDisplayName"]').invoke('val');
            cy.get('input[name="userDisplayName"]').should('have.class', 'is-valid');
        });
        
        it("should give the password field the valid class when a password has been entered", () => {
            cy.get('input[name="userPassword"]').clear();
            cy.get('input[name="userPassword"]').type("test12345");
            cy.get('input[name="userPassword"]').invoke('val');
            cy.get('input[name="userPassword"]').should('have.class', 'is-valid');
        });

    });

      // create one todo item
      /*cy.get("[data-cy=todo-input]") // grab the input textbox
        .type(TODO_ITEM_ONE) // type the title of the todo
        .type("{enter}");*/ // press enter

});
