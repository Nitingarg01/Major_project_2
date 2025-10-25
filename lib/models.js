export const collections = {
  users: 'users',
  resumes: 'resumes',
  interviews: 'interviews',
};

export class User {
  constructor(data) {
    this.id = data.id || data._id;
    this.email = data.email;
    this.name = data.name;
    this.password = data.password;
    this.googleId = data.googleId;
    this.image = data.image;
    this.createdAt = data.createdAt || new Date();
  }
}

export class Resume {
  constructor(data) {
    this.id = data.id || data._id;
    this.userId = data.userId;
    this.fileName = data.fileName;
    this.fileData = data.fileData;
    this.analysis = data.analysis;
    this.uploadDate = data.uploadDate || new Date();
  }
}

export class Interview {
  constructor(data) {
    this.id = data.id || data._id;
    this.userId = data.userId;
    this.resumeId = data.resumeId;
    this.jobRole = data.jobRole;
    this.experienceLevel = data.experienceLevel;
    this.numberOfQuestions = data.numberOfQuestions || 5;
    this.questions = data.questions || [];
    this.responses = data.responses || [];
    this.feedback = data.feedback;
    this.overallScore = data.overallScore;
    this.status = data.status || 'pending'; // pending, in-progress, completed
    this.createdAt = data.createdAt || new Date();
    this.completedAt = data.completedAt;
  }
}
