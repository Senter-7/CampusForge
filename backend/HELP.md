# Getting Started

### Reference Documentation
For further reference, please consider the following sections:

* [Official Apache Maven documentation](https://maven.apache.org/guides/index.html)
* [Spring Boot Maven Plugin Reference Guide](https://docs.spring.io/spring-boot/3.5.5/maven-plugin)
* [Create an OCI image](https://docs.spring.io/spring-boot/3.5.5/maven-plugin/build-image.html)
* [Spring Web](https://docs.spring.io/spring-boot/3.5.5/reference/web/servlet.html)
* [Spring Security](https://docs.spring.io/spring-boot/3.5.5/reference/web/spring-security.html)
* [Spring Data JPA](https://docs.spring.io/spring-boot/3.5.5/reference/data/sql.html#data.sql.jpa-and-spring-data)

### Guides
The following guides illustrate how to use some features concretely:

* [Building a RESTful Web Service](https://spring.io/guides/gs/rest-service/)
* [Serving Web Content with Spring MVC](https://spring.io/guides/gs/serving-web-content/)
* [Building REST services with Spring](https://spring.io/guides/tutorials/rest/)
* [Securing a Web Application](https://spring.io/guides/gs/securing-web/)
* [Spring Boot and OAuth2](https://spring.io/guides/tutorials/spring-boot-oauth2/)
* [Authenticating a User with LDAP](https://spring.io/guides/gs/authenticating-ldap/)
* [Accessing Data with JPA](https://spring.io/guides/gs/accessing-data-jpa/)
* [Accessing data with MySQL](https://spring.io/guides/gs/accessing-data-mysql/)

### Maven Parent overrides

Due to Maven's design, elements are inherited from the parent POM to the project POM.
While most of the inheritance is fine, it also inherits unwanted elements like `<license>` and `<developers>` from the parent.
To prevent this, the project POM contains empty overrides for these elements.
If you manually switch to a different parent and actually want the inheritance, you need to remove those overrides.


# Getting Started with the backend

### config


Enables Web Security:
    @EnableWebSecurity activates Spring Security.

SecurityFilterChain Bean:

    Disables CSRF protection (good for APIs).
    Enables CORS using the custom configuration.
    Allows all requests to /api/auth/** (register, login) without authentication.
    Requires authentication for all other endpoints.
    Sets session management to stateless (no server-side sessions; uses JWT).
CORS Configuration:
    Allows requests from any origin (*).
    Permits common HTTP methods and headers.
    Supports credentials.
Password Encoder Bean:
    Uses BCrypt for secure password hashing.
### controller
Handles HTTP requests and responses. Defines API endpoints and maps them to service methods.

### dto
Used to transfer data between layers (especially between controller and service). Helps shape request/response payloads and hides internal entity details.

### entity
Represents a table in the database. Defines the structure of your data and is managed by JPA/Hibernate.

### repository
Provides CRUD operations for entities. Interfaces with the database using Spring Data JPA.

### service
Contains business logic. Called by controllers to process requests, interact with repositories, and return results.

### util
Helper classes for common tasks (e.g., JWT generation, string manipulation). Not tied to business logic or data access.

### application.properties
env file that stores the global variables being used
### BackendApplication.java
### target
### mvnw
### mvnw.cmd
### pom.xml

