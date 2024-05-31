# nodejs-boilerplate


# Getting started
- Clone the repository
```
git clone  <git lab template url> <project_name>
```
- Install dependencies
```
cd <project_name>
npm install
```
- Build and run the project
```
copy contents from env.sample and create new file .env
update port and db details after than run the server
npm start
```
  Navigate to `http://localhost`

- API Document endpoints

  swagger-ui  Endpoint : http://localhost:8001/docs 



# Swagger
## Specification
The swagger specification file is named as swagger.yaml. The file is located under definition folder.
Example:
```
paths:
  /hello:
    get:
      x-swagger-router-controller: helloWorldRoute
      operationId: helloWorldGet
      tags:
        - /hello
      description: >-
        Returns the current weather for the requested location using the
        requested unit.
      parameters:
        - name: greeting
          in: query
          description: Name of greeting
          required: true
          type: string
      responses:
        '200':
          description: Successful request.
          schema:
            $ref: '#/definitions/Hello'
        default:
          description: Invalid request.
          schema:
            $ref: '#/definitions/Error'
definitions:
  Hello:
    properties:
      msg:
        type: string
    required:
      - msg
  Error:
    properties:
      message:
        type: string
    required:
      - message
```
### Highlights of the swagger.yaml File

- /hello:
  
  Specifies how users should be routed when they make a request to this endpoint.
- x-swagger-router-controller: helloWorldRoute

  Specifies  which code file acts as the controller for this endpoint.
- get:

  Specifies the method being requested (GET, PUT, POST, etc.).
- operationId: hello
  
  Specifies the direct method to invoke for this endpoint within the controller/router 
- parameters:
  
   This section defines the parameters of your endpoint. They can be defined as path, query, header, formData, or body.
- definitions:
   
   This section defines the structure of objects used in responses or as parameters.
