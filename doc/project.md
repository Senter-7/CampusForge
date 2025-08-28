# CampusForge UML Design Document

## 1. Introduction
CampusForge is a centralized web platform designed to help college students seamlessly form teams, manage projects, and share ideas. It addresses the inefficiencies of unstructured communication channels by enabling structured collaboration with features such as project posting, team formation, messaging, course/professor ratings, and event associations.

This document describes the refined UML class design for CampusForge, explaining its structure, relationships, and justifications for key architectural choices.

---

## 2. Key Design Principles
- **Student-Centric:** Students are the primary contributors; they post project ideas, report professors/courses, and form teams.
- **Admin Role Simplified:** Admins only moderate and oversee, not pre-populate domain data.
- **Flexibility:** Supports multiple universities, events, and courses without requiring central admin control.
- **Scalability:** Relationships and multiplicities are structured for real-world growth (e.g., many teams can work on a single idea).
- **Separation of Concerns:** Clear distinction between users, content (ideas, ratings), and interactions (teams, chats, memberships).

---

## 3. Class Overview

### 3.1 Core User Classes
- **User (abstract)**
  - Attributes: `userId`, `name`, `email`
  - Methods: `login()`, `logout()`

- **Student (extends User)**
  - Attributes: `skills: List<Skill>`
  - Methods: `postIdea()`, `searchProjects()`, `findTeammates()`, `reportCourse()`, `reportProfessor()`

- **Admin (extends User)**
  - Methods: `approveReports()`, `moderateRatings()`, `manageUniversities()`

---

### 3.2 Project & Team Management
- **ProjectIdea**
  - Attributes: `ideaId`, `title`, `description`, `requiredSkills: List<Skill>`
  - Methods: `addRequiredSkill()`, `editIdea()`
  - Relationship: Posted by `Student`, worked on by `Team`, linked to `Event`.

- **Team**
  - Attributes: `teamId`, `name`
  - Methods: `addMember()`, `assignProject()`
  - Relationship: Connected to `Student` through `Membership`.

- **Membership (association class)**
  - Attributes: `role`, `dateJoined`
  - Purpose: Resolves many-to-many between `Student` and `Team`.

---

### 3.3 Communication
- **GroupChat**
  - Attributes: `chatId`
  - Methods: `addMessage()`
  - Relationship: One per team.

- **Message**
  - Attributes: `messageId`, `content`, `timestamp`
  - Relationship: Sent by a `Student` within a `GroupChat`.

---

### 3.4 Courses and Professors
- **Course**
  - Attributes: `courseId`, `courseCode`, `title`, `approvalCount`, `status`
  - Methods: `incrementApproval()`, `checkApprovalStatus()`
  - Relationship: Reported by `Student`, can be linked to `Event`.

- **Professor**
  - Attributes: `professorId`, `name`, `department`, `approvalCount`, `status`
  - Methods: `incrementApproval()`, `checkApprovalStatus()`
  - Relationship: Reported by `Student`, can be linked to `Course`.

---

### 3.5 Ratings
- **Rating**
  - Attributes: `ratingId`, `score`, `comment`
  - Methods: `addRating(target)`
  - Relationship: Tied to `Course`, `Professor`, or both.

---

### 3.6 Events and University
- **Event**
  - Attributes: `eventId`, `name`, `type`, `date`
  - Relationship: Projects belong to events (hackathon, capstone, etc.).

- **University**
  - Attributes: `universityId`, `name`, `location`
  - Relationship: Students belong to a university; ensures system supports multiple universities.

---

### 3.7 Skills
- **Skill**
  - Attributes: `skillId`, `name`
  - Relationship: Linked to students and project ideas (required vs. possessed).

---

## 4. Key Relationships
- **Student ↔ ProjectIdea**: A student posts many ideas.
- **Student ↔ Team**: Many-to-many via `Membership`.
- **Team ↔ ProjectIdea**: A team works on one project idea; an idea can inspire multiple teams.
- **Team ↔ GroupChat ↔ Message**: Structured team communication.
- **Student ↔ Course/Professor**: Students propose/report them (with approval counts).
- **Rating ↔ Course/Professor**: Ratings target courses or professors.
- **ProjectIdea ↔ Event**: Ideas are tied to specific events.
- **University ↔ Student**: Students are scoped within a university.

---

## 5. Design Justifications
1. **Report & Approval Mechanism:** Courses and professors are added by students, not admins. Automatic approval after threshold ensures decentralized data growth.
2. **Association Classes:** Membership clarifies roles and timestamps in teams.
3. **Skills Integration:** Both student skills and project required skills allow matchmaking.
4. **Separation of Messaging:** GroupChat ensures messages are managed logically instead of directly linking teams to messages.
5. **Event Association:** Keeps projects contextualized (e.g., hackathon vs. coursework).
6. **Extensibility:** Additional features like endorsements, recommendations, or gamification can easily be added without breaking existing relationships.

---

The design balances simplicity with extensibility, creating a strong foundation for future feature additions.
