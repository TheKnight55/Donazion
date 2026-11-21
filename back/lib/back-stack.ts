import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as apigw from "aws-cdk-lib/aws-apigateway"
import * as lambda from "aws-cdk-lib/aws-lambda"
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'node:path'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import { Duration } from 'aws-cdk-lib'

import * as sqs from 'aws-cdk-lib/aws-sqs';

export class BackStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'BackQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });

    const vpc = ec2.Vpc.fromVpcAttributes(this, 'VPC', {
          vpcId: 'vpc-0ac65073206cac067',                                                                         // Replace with your VPC ID
          availabilityZones: ['us-east-2a', 'us-east-2b', 'us-east-2c'],                                          // Replace with your AZs
          privateSubnetIds: ['subnet-0ddb5fc9ff7dd7d02', 'subnet-04a902d13ac7d035d', 'subnet-0ad679759acc77234'], // Replace with your private subnet IDs
    })

    const securityGroup = ec2.SecurityGroup.fromSecurityGroupId(this, 'SG', 'sg-051fdd344c0191ef5', {             // Find your security group
        mutable: false
    })

    // const securityGroup3 = ec2.SecurityGroup.fromSecurityGroupId(this, 'SG', 'sg-03a983a0152002389', {             // Find your security group
    //     mutable: false
    // })
    // const securityGroup2 = ec2.SecurityGroup.fromSecurityGroupId(this, 'SG', 'sg-0d321a2bbfb81db2f', {             // Find your security group
    //     mutable: false
    // })

    // NOTE: You First have to add RDS_USER and RDS_PASSWORD to 
    // your environment variables for your account. Same with RDS_DATABASE and RDS_HOST
    const rdsUser     = process.env.RDS_USER!
    const rdsPassword = process.env.RDS_PASSWORD!
    const rdsDatabase = process.env.RDS_DATABASE!
    const rdsHost     = process.env.RDS_HOST!

 // generic default handler for any API function that doesn't get its own Lambda method
    const default_fn = new lambdaNodejs.NodejsFunction(this, 'LambdaDefaultFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'default.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'default')),
      vpc: vpc,                                                             // Reference the VPC defined above
      securityGroups: [securityGroup],                                      // Associate the security group
      //securityGroup2, securityGroup3],                                     
      timeout: Duration.seconds(3),                                         // Example timeout, adjust as needed
    })

    const api_endpoint = new apigw.LambdaRestApi(this, `organizationAPI`, {
      handler: default_fn,
      restApiName: `organizationAPI`, 
      proxy: false,
      defaultCorsPreflightOptions: {                                        // Optional BUT very helpful: Add CORS configuration 
        allowOrigins: apigw.Cors.ALL_ORIGINS,
        allowMethods: apigw.Cors.ALL_METHODS,
      },
    })

    // Create a resource for each lambda folder
    const todoResource = api_endpoint.root.addResource('todo')
    const loginOrgResource = todoResource.addResource('loginOrganization')
    const addCategoryResource = todoResource.addResource('addCategory')
    const deleteResource = todoResource.addResource('delete')
    const registerResource = todoResource.addResource('registerDonationCenter')
    const removeResource = todoResource.addResource('removeDonationCenter')


    const integration_parameters = { 
       proxy: false,
       passthroughBehavior: apigw.PassthroughBehavior.WHEN_NO_MATCH,
       
       integrationResponses: [
          {
            // Successful response from the Lambda function, no filter defined
            statusCode: '200',
            responseTemplates: {
              'application/json': '$input.json(\'$\')',       // should just pass JSON through untouched
            },
            responseParameters: {
                'method.response.header.Content-Type':                      "'application/json'",
                'method.response.header.Access-Control-Allow-Origin':       "'*'",
                'method.response.header.Access-Control-Allow-Credentials':  "'true'"
            },
          },
          {
            // For errors, we check if the error message is not empty, get the error data
            selectionPattern: '(\n|.)+',
            statusCode: "400",
            responseTemplates: {
              'application/json': JSON.stringify({ state: 'error', message: "$util.escapeJavaScript($input.path('$.errorMessage'))" })
          },
            responseParameters: {
                'method.response.header.Content-Type':                      "'application/json'",
                'method.response.header.Access-Control-Allow-Origin':       "'*'",
                'method.response.header.Access-Control-Allow-Credentials':  "'true'"
            },
          }
        ]
      }

    const response_parameters = {
   methodResponses: [
    {
      // Successful response from the integration
      statusCode: '200',
      // Define what parameters are allowed or not
      responseParameters: {
        'method.response.header.Content-Type': true,
        'method.response.header.Access-Control-Allow-Origin': true,
        'method.response.header.Access-Control-Allow-Credentials': true
      },

    },
    {
      // Same thing for the error responses
      statusCode: '400',
      responseParameters: {
        'method.response.header.Content-Type': true,
        'method.response.header.Access-Control-Allow-Origin': true,
        'method.response.header.Access-Control-Allow-Credentials': true
      },
 
    }
  ]
    }

    // Add a POST method to the '/todo/loginOrganization' resource
    const orgLogin_fn = new lambdaNodejs.NodejsFunction(this, 'loginOrganization', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'loginOrganization.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'loginOrganization')),
      vpc: vpc,                                                             // Reference the VPC defined above
      environment: {
          // Define your environment variables here
          RDS_USER: process.env.RDS_USER!,
          RDS_PASSWORD: process.env.RDS_PASSWORD!,
          RDS_DATABASE: process.env.RDS_DATABASE!,
          RDS_HOST: process.env.RDS_HOST!
        },
      securityGroups: [securityGroup],                                      // Associate the security group
      timeout: Duration.seconds(3),                                         // Example timeout, adjust as needed
    })

    loginOrgResource.addMethod('POST', new apigw.LambdaIntegration(orgLogin_fn, integration_parameters), response_parameters)

    // Add a POST method to the '/todo/addCategory' resource
    const addCategory_fn = new lambdaNodejs.NodejsFunction(this, 'addCategory', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'addCategory.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'addCategory')),
      vpc: vpc,                                                             // Reference the VPC defined above
      environment: {
          // Define your environment variables here
          RDS_USER: process.env.RDS_USER!,
          RDS_PASSWORD: process.env.RDS_PASSWORD!,
          RDS_DATABASE: process.env.RDS_DATABASE!,
          RDS_HOST: process.env.RDS_HOST!
        },
      securityGroups: [securityGroup],                                      // Associate the security group
      timeout: Duration.seconds(3),                                         // Example timeout, adjust as needed
    })

    addCategoryResource.addMethod('POST', new apigw.LambdaIntegration(addCategory_fn, integration_parameters), response_parameters)


  // Add a POST method to the '/todo/registerDonationCenter' resource
  const donCenterRegister_fn = new lambdaNodejs.NodejsFunction(this, 'registerDonationCenter', {
    runtime: lambda.Runtime.NODEJS_22_X,
    handler: 'registerDonationCenter.handler',
    code: lambda.Code.fromAsset(path.join(__dirname, 'registerDonationCenter')),
    vpc: vpc,
    environment: {
      RDS_USER: rdsUser,
      RDS_PASSWORD: rdsPassword,
      RDS_DATABASE: rdsDatabase,
      RDS_HOST: rdsHost,
    },
    securityGroups: [securityGroup],
    timeout: Duration.seconds(3),
  })

  registerResource.addMethod(
    'POST',
    new apigw.LambdaIntegration(donCenterRegister_fn, integration_parameters),
    response_parameters
  )

  // Add a POST method to the '/todo/removeDonationCenter' resource
  const removeCenterRegister_fn = new lambdaNodejs.NodejsFunction(this, 'removeDonationCenter', {
    runtime: lambda.Runtime.NODEJS_22_X,
    handler: 'removeDonationCenter.handler',
    code: lambda.Code.fromAsset(path.join(__dirname, 'removeDonationCenter')),
    vpc: vpc,
    environment: {
      RDS_USER: rdsUser,
      RDS_PASSWORD: rdsPassword,
      RDS_DATABASE: rdsDatabase,
      RDS_HOST: rdsHost,
    },
    securityGroups: [securityGroup],
    timeout: Duration.seconds(3),
  })

  removeResource.addMethod(
    'POST',
    new apigw.LambdaIntegration(removeCenterRegister_fn, integration_parameters),
    response_parameters
    )
  }   
}    
