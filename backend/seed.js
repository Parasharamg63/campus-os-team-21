require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const IssueType = require('./src/models/IssueType');
const Ticket = require('./src/models/Ticket');
const Notification = require('./src/models/Notification');
const Feedback = require('./src/models/Feedback');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campus_avaaj';
    await mongoose.connect(mongoUri);
    console.log('[Seed] Connected to MongoDB');

    // Clear existing collections
    await User.deleteMany({});
    await IssueType.deleteMany({});
    await Ticket.deleteMany({});
    await Notification.deleteMany({});
    await Feedback.deleteMany({});
    console.log('[Seed] Cleared existing data');

    // 1. Seed Users
    const users = [
      {
        role: 'admin',
        name: 'Admin Officer',
        email_id: 'admin@team21.com',
        phone_number: '9876543200',
        institution_name: 'Team 21 Engineering College',
        team_id: 'team21',
        otp: '730792',
        created_by: 'system',
      },
      {
        role: 'office_staff',
        name: 'Kumar Gowda',
        email_id: 'kumar@team21.com',
        phone_number: '9876543215',
        dept: 'Campus Maintenance',
        designation: 'Supervisor',
        team_id: 'team21',
        otp: '730792',
        created_by: 'admin@team21.com',
      },
      {
        role: 'office_staff',
        name: 'Ramesh Sharma',
        email_id: 'ramesh@team21.com',
        phone_number: '9876543216',
        dept: 'Campus Maintenance',
        designation: 'Senior Electrician',
        team_id: 'team21',
        otp: '730792',
        created_by: 'admin@team21.com',
      },
      {
        role: 'student',
        name: 'Asha Kumar',
        email_id: 'asha@team21.com',
        phone_number: '9876543210',
        usn: '1CF24CS001',
        dept: 'CSE',
        team_id: 'team21',
        otp: '730792',
        created_by: 'admin@team21.com',
      },
      {
        role: 'student',
        name: 'Rahul Verma',
        email_id: 'rahul@team21.com',
        phone_number: '9876543220',
        usn: '1CF24EC045',
        dept: 'ECE',
        team_id: 'team21',
        otp: '730792',
        created_by: 'admin@team21.com',
      },
      {
        role: 'faculty',
        name: 'Dr. Meera Rao',
        email_id: 'meera@team21.com',
        phone_number: '9876543212',
        designation: 'Professor',
        team_id: 'team21',
        otp: '730792',
        created_by: 'admin@team21.com',
      },
    ];

    await User.insertMany(users);
    console.log('[Seed] Users seeded successfully');

    // 2. Seed Issue Types
    const issueTypes = [
      {
        issue_type_id: 'ITY-82067401-ELEC',
        name: 'Electrical',
        description: 'Fans, lights, switches, sockets, power backup, AC units',
        created_by: 'kumar@team21.com',
      },
      {
        issue_type_id: 'ITY-82067401-PLMB',
        name: 'Plumbing',
        description: 'Taps, leaks, washrooms, pipeline blockages, drinking water coolers',
        created_by: 'kumar@team21.com',
      },
      {
        issue_type_id: 'ITY-82067401-FURN',
        name: 'Furniture',
        description: 'Broken benches, chairs, podium, whiteboard, doors, window latches',
        created_by: 'kumar@team21.com',
      },
      {
        issue_type_id: 'ITY-82067401-ITNT',
        name: 'IT & Network',
        description: 'Wi-Fi access points, classroom projectors, lab PC, LAN ports',
        created_by: 'kumar@team21.com',
      },
      {
        issue_type_id: 'ITY-82067401-CLNL',
        name: 'Sanitation & Cleanliness',
        description: 'Corridor cleanliness, washroom hygiene, garbage clearance',
        created_by: 'kumar@team21.com',
      },
    ];

    await IssueType.insertMany(issueTypes);
    console.log('[Seed] Issue types seeded successfully');

    // 3. Seed Tickets
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 2);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const tickets = [
      {
        ticket_id: 'TKT-82067274-46FA',
        issue_type_id: 'ITY-82067401-ELEC',
        issue_type_name: 'Electrical',
        title: 'Ceiling fan making loud noise and stopping',
        description: 'Room 204, Block B: The front ceiling fan wobbles violently and ceases rotation after 5 minutes.',
        location: 'Room 204, Block B',
        status: 'open',
        tat: {
          expected_by: tomorrow.toISOString().split('T')[0],
          note: 'Replacement capacitor and bearing dispatched',
          updated_by: 'kumar@team21.com',
          updated_at: new Date(),
        },
        update: {
          note: 'Electrician Ramesh Sharma assigned. Inspection underway.',
          updated_by: 'kumar@team21.com',
          updated_by_name: 'Kumar Gowda',
          updated_at: new Date(),
        },
        assigned_to: {
          email_id: 'ramesh@team21.com',
          name: 'Ramesh Sharma',
          designation: 'Senior Electrician',
          phone_number: '9876543216',
          assigned_at: new Date(),
          assigned_by: 'kumar@team21.com',
        },
        reported_by: 'asha@team21.com',
        reported_by_name: 'Asha Kumar',
        reported_by_role: 'student',
        reported_by_dept: 'CSE',
        reported_by_phone_number: '9876543210',
        timeline: [
          {
            status: 'Registered',
            note: 'Complaint registered by student Asha Kumar',
            actor_name: 'Asha Kumar',
            actor_role: 'student',
            timestamp: new Date(Date.now() - 3600000 * 6),
          },
          {
            status: 'Assigned to Maintenance',
            note: 'Assigned to Ramesh Sharma (Senior Electrician)',
            actor_name: 'Kumar Gowda',
            actor_role: 'office_staff',
            timestamp: new Date(Date.now() - 3600000 * 4),
          },
          {
            status: 'In Progress',
            note: 'Electrician Ramesh Sharma assigned. Inspection underway.',
            actor_name: 'Kumar Gowda',
            actor_role: 'office_staff',
            timestamp: new Date(Date.now() - 3600000 * 2),
          },
        ],
      },
      {
        ticket_id: 'TKT-82067280-99BC',
        issue_type_id: 'ITY-82067401-ITNT',
        issue_type_name: 'IT & Network',
        title: 'Lab PC 12 will not boot - continuous beep',
        description: 'Computer Science Lab 3, Row 2, Seat 12: Machine gives continuous BIOS beeps during lab sessions.',
        location: 'Lab 3, Ground Floor CSE Wing',
        status: 'resolved',
        tat: {
          expected_by: today.toISOString().split('T')[0],
          note: 'RAM reseating and CMOS test',
          updated_by: 'kumar@team21.com',
          updated_at: new Date(Date.now() - 3600000 * 12),
        },
        update: {
          note: 'Faulty DDR4 RAM stick replaced. System benchmarked and working normally.',
          updated_by: 'kumar@team21.com',
          updated_by_name: 'Kumar Gowda',
          updated_at: new Date(Date.now() - 3600000 * 1),
        },
        assigned_to: {
          email_id: 'kumar@team21.com',
          name: 'Kumar Gowda',
          designation: 'Supervisor',
          phone_number: '9876543215',
          assigned_at: new Date(Date.now() - 3600000 * 14),
          assigned_by: 'admin@team21.com',
        },
        reported_by: 'asha@team21.com',
        reported_by_name: 'Asha Kumar',
        reported_by_role: 'student',
        reported_by_dept: 'CSE',
        reported_by_phone_number: '9876543210',
        timeline: [
          {
            status: 'Registered',
            note: 'Complaint registered by student Asha Kumar',
            actor_name: 'Asha Kumar',
            actor_role: 'student',
            timestamp: new Date(Date.now() - 3600000 * 20),
          },
          {
            status: 'In Progress',
            note: 'Hardware diagnosis in progress by IT support team.',
            actor_name: 'Kumar Gowda',
            actor_role: 'office_staff',
            timestamp: new Date(Date.now() - 3600000 * 10),
          },
          {
            status: 'Completed / Resolved',
            note: 'Faulty DDR4 RAM stick replaced. System benchmarked and working normally.',
            actor_name: 'Kumar Gowda',
            actor_role: 'office_staff',
            timestamp: new Date(Date.now() - 3600000 * 1),
          },
        ],
      },
      {
        ticket_id: 'TKT-82067295-31DD',
        issue_type_id: 'ITY-82067401-PLMB',
        issue_type_name: 'Plumbing',
        title: 'Severe water leak under sink in washroom',
        description: 'Block A, 2nd floor men washroom: Central sink drain pipe broken, water flooding onto the tiled floor.',
        location: 'Block A, 2nd Floor Washroom',
        status: 'open',
        tat: {
          expected_by: yesterday.toISOString().split('T')[0], // Overdue example!
          note: 'Emergency plumbing replacement',
          updated_by: 'kumar@team21.com',
          updated_at: new Date(Date.now() - 3600000 * 30),
        },
        update: {
          note: 'Water valve isolated to prevent flooding. Procurement of PVC coupler pending.',
          updated_by: 'kumar@team21.com',
          updated_by_name: 'Kumar Gowda',
          updated_at: new Date(Date.now() - 3600000 * 5),
        },
        reported_by: 'rahul@team21.com',
        reported_by_name: 'Rahul Verma',
        reported_by_role: 'student',
        reported_by_dept: 'ECE',
        reported_by_phone_number: '9876543220',
        timeline: [
          {
            status: 'Registered',
            note: 'Complaint registered by student Rahul Verma',
            actor_name: 'Rahul Verma',
            actor_role: 'student',
            timestamp: new Date(Date.now() - 3600000 * 35),
          },
          {
            status: 'In Progress',
            note: 'Water valve isolated to prevent flooding. Procurement of PVC coupler pending.',
            actor_name: 'Kumar Gowda',
            actor_role: 'office_staff',
            timestamp: new Date(Date.now() - 3600000 * 5),
          },
        ],
      },
      {
        ticket_id: 'TKT-82067302-88EF',
        issue_type_id: 'ITY-82067401-FURN',
        issue_type_name: 'Furniture',
        title: 'Broken desk wooden top in Seminar Hall 1',
        description: 'Third row, seat 5: Wooden surface detached from metal frame with exposed sharp screws.',
        location: 'Seminar Hall 1, Administrative Wing',
        status: 'acknowledged',
        acknowledged_at: new Date(Date.now() - 3600000 * 2),
        update: {
          note: 'Screws replaced and desk re-anchored securely with reinforcement brackets.',
          updated_by: 'kumar@team21.com',
          updated_by_name: 'Kumar Gowda',
          updated_at: new Date(Date.now() - 3600000 * 6),
        },
        reported_by: 'asha@team21.com',
        reported_by_name: 'Asha Kumar',
        reported_by_role: 'student',
        reported_by_dept: 'CSE',
        reported_by_phone_number: '9876543210',
        timeline: [
          {
            status: 'Registered',
            note: 'Complaint registered',
            actor_name: 'Asha Kumar',
            actor_role: 'student',
            timestamp: new Date(Date.now() - 3600000 * 48),
          },
          {
            status: 'Completed / Resolved',
            note: 'Screws replaced and desk re-anchored securely with reinforcement brackets.',
            actor_name: 'Kumar Gowda',
            actor_role: 'office_staff',
            timestamp: new Date(Date.now() - 3600000 * 6),
          },
          {
            status: 'Acknowledged',
            note: 'Reporter confirmed resolution. Ticket closed successfully.',
            actor_name: 'Asha Kumar',
            actor_role: 'student',
            timestamp: new Date(Date.now() - 3600000 * 2),
          },
        ],
      },
    ];

    await Ticket.insertMany(tickets);
    console.log('[Seed] Tickets seeded successfully');

    // 4. Seed Notifications
    const notifications = [
      {
        recipient_email: 'asha@team21.com',
        title: 'Ticket Resolved!',
        message: '[TKT-82067280-99BC] Faulty DDR4 RAM stick replaced. System benchmarked and working normally.',
        ticket_id: 'TKT-82067280-99BC',
        type: 'status_updated',
        read: false,
      },
      {
        recipient_email: 'asha@team21.com',
        title: 'Maintenance Update on Your Ticket',
        message: '[TKT-82067274-46FA] Electrician Ramesh Sharma assigned. Inspection underway.',
        ticket_id: 'TKT-82067274-46FA',
        type: 'status_updated',
        read: false,
      },
      {
        recipient_email: 'cm@team21.com',
        title: 'New Maintenance Ticket Raised',
        message: '[TKT-82067274-46FA] Ceiling fan making loud noise in Room 204, Block B',
        ticket_id: 'TKT-82067274-46FA',
        type: 'ticket_created',
        read: true,
      },
      {
        recipient_email: 'cm@team21.com',
        title: 'Ticket Closed & Acknowledged',
        message: 'Student acknowledged resolution for [TKT-82067302-88EF]: Broken desk wooden top',
        ticket_id: 'TKT-82067302-88EF',
        type: 'acknowledged',
        read: true,
      },
    ];

    await Notification.insertMany(notifications);
    console.log('[Seed] Notifications seeded');

    // 5. Seed Reviews / Feedback
    const feedbacks = [
      {
        author_name: 'Asha Kumar',
        author_email: 'asha@team21.com',
        rating: 5,
        category: 'IT & Lab Maintenance',
        comment: 'The computer lab PC issue was fixed very quickly by the maintenance team. Appreciate the quick response!',
        ticket_id: 'TKT-82067280-99BC',
      },
      {
        author_name: 'Rahul Verma',
        author_email: 'rahul@team21.com',
        rating: 4,
        category: 'Classroom Infrastructure',
        comment: 'Nice system to track grievances in real time. Very transparent tracking ID.',
      },
    ];

    await Feedback.insertMany(feedbacks);
    console.log('[Seed] Feedbacks seeded');

    console.log('--- SEEDING COMPLETED SUCCESSFULLY ---');
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedData();
