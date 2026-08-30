TaskMaster A Collaborative Task Tracking System

Brief
Develop a backend system for a task tracking and management application that facilitates collaboration and organization within teams or projects. The application should allow users to create, assign, and track tasks, as well as collaborate with team members through comments and attachments.

Detailed Requirements:

Project Setup:

[Node.js]

Set up a Node.js project using Express.js.

Initialize dependencies with npm or yarn.

Use a chosen database system for data storage.

[Java]

Set up a Java project using a framework such as Spring Boot.

Use Maven or Gradle for dependency management.

Choose a database system for data storage (e.g., MySQL, PostgreSQL, MongoDB).

User Authentication and Management:

Implement secure user authentication and authorization.

Provide endpoints for user registration, login, and profile management.

Use secure password hashing and consider implementing JWT for session management.

Task Management:

Design a data model for tasks with attributes like title, description, and due date.

Implement CRUD operations for tasks.

Include features for task filtering, sorting, and searching.

Team/Project Collaboration:

Allow users to create or join teams/projects.

Enable task assignment within teams/projects.

Implement comments and attachments feature for tasks.

(Optional Extension) Implement real-time updates and notifications.

RESTful API Endpoints:

Design endpoints for user authentication, task management, and collaboration features.

Ensure proper validation and error handling.

Follow RESTful API best practices.

User stories:

As a user, I want to be able to create a new account so that I can access the task tracking platform.

As a user, I want to log in to my account securely using my credentials.

As a user, I want to view my profile and update my personal information.

As a user, I want to create a new task with a title, description, and due date.

As a user, I want to view a list of all tasks assigned to me.

As a user, I want to mark a task as completed when I finish working on it.

As a user, I want to assign a task to another team member.

As a user, I want to filter tasks based on their status (e.g., open, completed).

As a user, I want to search for tasks by title or description.

As a user, I want to collaborate with team members by adding comments and attachments to tasks.

As a user, I want to create a new team or project and invite team members to join.

As a user, I want to securely log out of my account when I'm done using the platform.

(Optional Extension) As a user, I want to receive notifications when a task is assigned to me or updated. (Implement real-time notifications using WebSockets or Server-Sent Events)

(Optional but good to have) As a user, I want to integrate a generative AI model to automatically generate task descriptions or summaries based on user input, reducing manual effort in task creation.

Submission guidelines
Write a clear and concise README file

To submit your project, please provide a link to your GitHub repository.

Code Quality:

Follow best practices for code organization and styling.

Include comments and documentation where necessary.

Ensure your code is clean and maintainable.

[Important] Make sure the repository is public.