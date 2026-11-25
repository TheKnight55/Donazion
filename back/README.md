# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   type-check the project
* `npm run watch`   watch for changes and type-check
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template


Our use cases:

1. Login Organization            | - Emil
    To test, use email: login@donazion.com and password: banana1234
    Select Organization from the dropdown menu and press "Log In"

2. Show Dashboard Orgnization    | - Stephen

3. Add Category	                 | - Emil
    To test, type the name of the category into the white input field to the left of "Add Category" button. Then, click "Add Category"

4. Upload Category Items	     | - Snyder
    To test, go the the "Organization" page, and click the "Add category item" button.
    Then you will be prompted to enter the necessary information.
    Once all the data is input, you can check the console for the status code and what it means.
    Since you can add multiple items at once, there can be status code 200, 207, or 400.

    Status Code: 200
    All items where added to the database correctly

    Status Code: 207
    Some items where added, but one or more items also failed
    The items that had no issues will still be added, but you can see which items faild and for what in the error field

    Status Code: 400
    All items failed, nothing happened

5. Register DonationCenter	     | - Deni

6. DC: Login DonationCenter	     | - Snyder
    To test, use email: food.pantry@gmail.com and password: password123
    Select Donation Center from the dropdown menu and press "Log In"
7. Remove DonationCenter	     | - Deni

8. List DonationCenters Org	     | - Stephen

9. Remove Category               | - Emil
    To test, click "Remove Category" for the desired category