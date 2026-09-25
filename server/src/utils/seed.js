/**
 * Seed script to populate the database with sample data.
 * Run with: npm run seed
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Activity = require('../models/Activity');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/smart-ops';

const seedData = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Project.deleteMany({});
    await Task.deleteMany({});
    await Activity.deleteMany({});
    console.log('Cleared existing data.');

    // Create users
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@smartops.com',
      password: 'admin123',
      role: 'admin',
    });

    const manager1 = await User.create({
      name: 'Rahul Sharma',
      email: 'rahul@smartops.com',
      password: 'manager123',
      role: 'manager',
    });

    const manager2 = await User.create({
      name: 'Priya Patel',
      email: 'priya@smartops.com',
      password: 'manager123',
      role: 'manager',
    });

    const emp1 = await User.create({
      name: 'Amit Kumar',
      email: 'amit@smartops.com',
      password: 'employee123',
      role: 'employee',
    });

    const emp2 = await User.create({
      name: 'Sneha Gupta',
      email: 'sneha@smartops.com',
      password: 'employee123',
      role: 'employee',
    });

    const emp3 = await User.create({
      name: 'Vikram Singh',
      email: 'vikram@smartops.com',
      password: 'employee123',
      role: 'employee',
    });

    console.log('Created users.');

    // Create projects
    const project1 = await Project.create({
      name: 'E-Commerce Platform',
      description: 'Build a full-featured e-commerce platform with payment integration, product catalog, and order management.',
      startDate: new Date('2026-09-01'),
      deadline: new Date('2026-12-31'),
      status: 'active',
      manager: manager1._id,
      teamMembers: [emp1._id, emp2._id],
    });

    const project2 = await Project.create({
      name: 'Mobile Banking App',
      description: 'Develop a secure mobile banking application with transaction history, fund transfers, and bill payments.',
      startDate: new Date('2026-10-01'),
      deadline: new Date('2027-03-31'),
      status: 'planning',
      manager: manager2._id,
      teamMembers: [emp2._id, emp3._id],
    });

    const project3 = await Project.create({
      name: 'Internal HR Portal',
      description: 'Company HR management portal for employee records, leave management, and payroll processing.',
      startDate: new Date('2026-08-15'),
      deadline: new Date('2026-11-30'),
      status: 'active',
      manager: manager1._id,
      teamMembers: [emp1._id, emp3._id],
    });

    console.log('Created projects.');

    // Create tasks for project 1
    const tasks = await Task.insertMany([
      {
        title: 'Design database schema',
        description: 'Create the MongoDB schema design for products, orders, and users.',
        project: project1._id,
        assignee: emp1._id,
        priority: 'high',
        status: 'completed',
        dueDate: new Date('2026-09-15'),
      },
      {
        title: 'Payment API integration',
        description: 'Integrate Stripe payment gateway for handling transactions.',
        project: project1._id,
        assignee: emp2._id,
        priority: 'critical',
        status: 'in_progress',
        dueDate: new Date('2026-10-15'),
      },
      {
        title: 'Product catalog UI',
        description: 'Build the frontend product listing and detail pages.',
        project: project1._id,
        assignee: emp1._id,
        priority: 'medium',
        status: 'todo',
        dueDate: new Date('2026-10-30'),
      },
      {
        title: 'Shopping cart feature',
        description: 'Implement add to cart, update quantity, and remove items functionality.',
        project: project1._id,
        assignee: emp2._id,
        priority: 'high',
        status: 'review',
        dueDate: new Date('2026-10-20'),
      },
      // Tasks for project 2
      {
        title: 'Security audit planning',
        description: 'Plan the security audit for the mobile banking app architecture.',
        project: project2._id,
        assignee: emp3._id,
        priority: 'critical',
        status: 'todo',
        dueDate: new Date('2026-10-10'),
      },
      {
        title: 'UI wireframes',
        description: 'Create wireframes for the mobile banking app screens.',
        project: project2._id,
        assignee: emp2._id,
        priority: 'medium',
        status: 'in_progress',
        dueDate: new Date('2026-10-05'),
      },
      // Tasks for project 3
      {
        title: 'Employee records module',
        description: 'Build the CRUD module for managing employee records.',
        project: project3._id,
        assignee: emp1._id,
        priority: 'high',
        status: 'in_progress',
        dueDate: new Date('2026-09-20'),
      },
      {
        title: 'Leave management system',
        description: 'Implement leave request, approval workflow, and balance tracking.',
        project: project3._id,
        assignee: emp3._id,
        priority: 'medium',
        status: 'todo',
        dueDate: new Date('2026-10-25'),
      },
    ]);

    console.log('Created tasks.');

    // Create some activity entries
    await Activity.insertMany([
      {
        user: manager1._id,
        action: 'project_created',
        entityType: 'project',
        entityId: project1._id,
        entityName: project1.name,
        projectId: project1._id,
        newValue: project1.name,
        details: `Created project "${project1.name}"`,
      },
      {
        user: manager1._id,
        action: 'status_change',
        entityType: 'task',
        entityId: tasks[0]._id,
        entityName: tasks[0].title,
        projectId: project1._id,
        previousValue: 'in_progress',
        newValue: 'completed',
        details: `Changed status from "in_progress" to "completed"`,
      },
      {
        user: manager1._id,
        action: 'task_assigned',
        entityType: 'task',
        entityId: tasks[1]._id,
        entityName: tasks[1].title,
        projectId: project1._id,
        newValue: emp2.name,
        details: `Assigned task "${tasks[1].title}" to ${emp2.name}`,
      },
    ]);

    console.log('Created activity logs.');
    console.log('\n--- Seed completed successfully ---');
    console.log('\nTest Accounts:');
    console.log('  Admin:    admin@smartops.com    / admin123');
    console.log('  Manager:  rahul@smartops.com    / manager123');
    console.log('  Manager:  priya@smartops.com    / manager123');
    console.log('  Employee: amit@smartops.com     / employee123');
    console.log('  Employee: sneha@smartops.com    / employee123');
    console.log('  Employee: vikram@smartops.com   / employee123');

    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
};

seedData();
