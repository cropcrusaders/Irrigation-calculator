Irrigation Schedule Calculator

An irrigation scheduling calculator that helps farmers plan optimized irrigation schedules based on crop water needs, weather forecasts, and soil moisture levels. This web-based application integrates real-time weather data from Yr.no and utilizes mathematical models to provide tailored irrigation recommendations.

Table of Contents

	•	Features
	•	Demo
	•	Architecture
	•	Prerequisites
	•	Setup Instructions
	•	Front-End Setup
	•	Option A: Using Amazon S3 and CloudFront
	•	Option B: Using AWS Amplify
	•	Back-End Setup (AWS Lambda and API Gateway)
	•	Usage
	•	Project Structure
	•	Mathematical Model
	•	License
	•	Contact

Features

	•	User Inputs: Crop type, growth stage, soil moisture content, field capacity, wilting point, root zone depth, irrigation efficiency, and depletion fraction.
	•	Weather Data Integration: Fetches real-time weather data (temperature, humidity, wind speed, precipitation) from Yr.no based on the user’s location.
	•	Mathematical Calculations: Uses established agricultural formulas to compute evapotranspiration, irrigation requirements, and scheduling.
	•	Results Display: Provides detailed irrigation schedules, including whether irrigation is needed immediately and recommended irrigation intervals.
	•	Responsive Design: Accessible on various devices with a user-friendly interface.

Demo

Access the live application at:

	•	Front-End URL: https://your-cloudfront-url.cloudfront.net (Replace with your actual CloudFront or Amplify URL)

Architecture

	•	Front-End: Static website hosted on AWS S3 and delivered via AWS CloudFront or hosted using AWS Amplify.
	•	Back-End: AWS Lambda function serving as a proxy server to fetch weather data from Yr.no’s API, integrated with AWS API Gateway.
	•	Technologies Used:
	•	HTML, CSS, JavaScript for the front-end.
	•	Node.js for the back-end Lambda function.
	•	AWS services: S3, CloudFront, Lambda, API Gateway.

Prerequisites

	•	AWS Account: To deploy and host the application using AWS services.
	•	Basic Knowledge:
	•	Familiarity with AWS services like S3, CloudFront, Lambda, and API Gateway.
	•	Understanding of web development (HTML, CSS, JavaScript).
	•	Tools:
	•	Text editor or IDE (e.g., Visual Studio Code).
	•	AWS CLI (optional, for command-line operations).
	•	Node.js and npm (for packaging the Lambda function).

Setup Instructions

Front-End Setup

Option A: Using Amazon S3 and CloudFront

	1.	Prepare Front-End Files
	•	Ensure you have the following files:
	•	index.html
	•	styles.css
	•	script.js
	2.	Create an S3 Bucket
	•	Navigate to the AWS S3 console.
	•	Click Create bucket.
	•	Bucket Name: Must be unique (e.g., irrigation-calculator-unique-id).
	•	Region: Select your preferred region.
	•	Public Access: Uncheck Block all public access.
	•	Confirm that you acknowledge the risk.
	•	Click Create bucket.
	3.	Configure Static Website Hosting
	•	Open your bucket, go to Properties.
	•	Scroll to Static website hosting and click Edit.
	•	Enable static website hosting.
	•	Set Index document to index.html.
	•	Save changes.
	4.	Upload Files
	•	Go to the Objects tab.
	•	Click Upload and add your front-end files.
	•	Set permissions to Public read access during upload.
	5.	Set Bucket Policy
	•	Go to Permissions → Bucket Policy.
	•	Add the following policy (replace your-bucket-name):

{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}


	6.	Create CloudFront Distribution
	•	Navigate to AWS CloudFront.
	•	Click Create Distribution.
	•	Origin Domain Name: Your S3 bucket’s website endpoint.
	•	Viewer Protocol Policy: Redirect HTTP to HTTPS.
	•	Allowed HTTP Methods: GET, HEAD.
	•	Cache Policy: Use managed policy for caching static content.
	•	Create Distribution.
	•	Wait for the distribution status to become Deployed.
	7.	Update Front-End Code
	•	In script.js, ensure the proxyUrl variable is set to your API Gateway endpoint.
	8.	Access Your Application
	•	Use the CloudFront domain name to access your application.

Option B: Using AWS Amplify

	1.	Deploy via Amplify Console
	•	Go to the AWS Amplify Console.
	•	Click Get Started under Deploy.
	•	Connect your Git repository (e.g., GitHub).
	•	Select your repository and branch.
	•	Configure build settings if necessary.
	•	Click Save and Deploy.
	•	Amplify will automatically build and deploy your application.
	2.	Update Front-End Code
	•	Ensure the proxyUrl in script.js points to your API Gateway endpoint.
	3.	Access Your Application
	•	Use the domain provided by Amplify to access your application.

Back-End Setup (AWS Lambda and API Gateway)

	1.	Create a Lambda Function
	•	Go to AWS Lambda service.
	•	Click Create function.
	•	Function name: IrrigationProxyFunction.
	•	Runtime: Node.js 14.x or higher.
	•	Click Create function.
	2.	Add Function Code
	•	Use the following code in index.js:

const fetch = require('node-fetch');

exports.handler = async (event) => {
    const body = JSON.parse(event.body);
    const { url, headers } = body;

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': headers['User-Agent']
            }
        });
        const data = await response.json();

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            body: JSON.stringify(data),
        };
    } catch (error) {
        console.error('Proxy error:', error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({ error: 'Proxy error' }),
        };
    }
};


	3.	Add Dependencies
	•	Since node-fetch is required, package the Lambda function:
	•	Create a folder locally.
	•	Run npm init -y.
	•	Run npm install node-fetch.
	•	Include index.js with the code above.
	•	Zip the contents and upload to Lambda.
	4.	Set Up API Gateway
	•	Navigate to AWS API Gateway.
	•	Click Create API → HTTP API.
	•	Choose Build.
	•	Integration type: Lambda.
	•	Lambda function: Select IrrigationProxyFunction.
	•	Click Next.
	•	Routes: Add a POST route with path /proxy.
	•	Enable CORS and allow Content-Type header.
	•	Click Next and Create.
	5.	Obtain API Endpoint
	•	After creation, note the Invoke URL.
	•	It will be in the format: https://<api-id>.execute-api.<region>.amazonaws.com/proxy.
	6.	Update Front-End Code
	•	In script.js, set the proxyUrl variable to the API endpoint.

const proxyUrl = 'https://<api-id>.execute-api.<region>.amazonaws.com/proxy';



Usage

	1.	Access the Application
	•	Open the application URL in your web browser.
	2.	Provide Input Data
	•	Select the Crop Type and Growth Stage.
	•	Enter soil parameters:
	•	Current Soil Moisture Content (%)
	•	Soil Field Capacity (%)
	•	Soil Wilting Point (%)
	•	Root Zone Depth (mm)
	•	Irrigation Efficiency (0-1)
	•	Depletion Fraction (p)
	•	Click Fetch Weather Data and allow location access.
	3.	Fetch Weather Data
	•	The application will retrieve current weather data from Yr.no.
	4.	Calculate Irrigation Schedule
	•	Click Calculate Irrigation Schedule.
	•	View the results, which include:
	•	Crop Evapotranspiration (ETc)
	•	Effective Rainfall (Pe)
	•	Net and Gross Irrigation Requirements (Ir and Ig)
	•	Available Water Capacity (AWC)
	•	Readily Available Water (RAW)
	•	Soil Moisture Deficit (SMD)
	•	Irrigation Interval (Ti)
	•	Whether irrigation is needed immediately.

Project Structure

- index.html          # Main HTML file
- styles.css          # CSS styling
- script.js           # JavaScript logic
- README.md           # Project documentation

Mathematical Model

The calculator uses the following key equations:

	1.	Reference Evapotranspiration (ET₀):

\text{ET}0 = 0.0023 \times (T{\text{avg}} + 17.8) \times (T_{\text{max}} - T_{\text{min}})^{0.5} \times R_a

	2.	Crop Evapotranspiration (ETc):

\text{ET}_c = \text{ET}_0 \times K_c

	3.	Effective Rainfall (Pe):

P_e = P_t \times \text{Efficiency Factor}

	4.	Net Irrigation Requirement (Ir):

I_r = \text{ET}_c - P_e

	5.	Gross Irrigation Requirement (Ig):

I_g = \frac{I_r}{E_i}

	6.	Available Water Capacity (AWC):

\text{AWC} = (\theta_{\text{fc}} - \theta_{\text{wp}}) \times D

	7.	Readily Available Water (RAW):

\text{RAW} = p \times \text{AWC}

	8.	Soil Moisture Deficit (SMD):

\text{SMD} = (\theta_{\text{fc}} - \theta_v) \times D

	9.	Irrigation Interval (Ti):

T_i = \frac{\text{RAW}}{\text{ET}_c}


Where:

	•	 K_c  = Crop coefficient based on crop type and growth stage.
	•	 E_i  = Irrigation efficiency.
	•	 p  = Depletion fraction.
	•	 \theta_{\text{fc}}  = Field capacity.
	•	 \theta_{\text{wp}}  = Wilting point.
	•	 \theta_v  = Current soil moisture content.
	•	 D  = Root zone depth.

License

This project is licensed under the MIT License.

Contact

For questions or support, please contact:

	•	Name: Your Name
	•	Email: your-email@example.com

Disclaimer: This tool is intended for educational purposes and should not replace professional agricultural advice. Always consult with local experts and consider local conditions when making irrigation decisions.
