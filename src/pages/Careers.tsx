"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Briefcase, MapPin, Clock, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface JobOpening {
  id: string;
  title: string;
  department: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
  description: string;
  requirements: string[];
}

const MOCK_JOBS: JobOpening[] = [
  {
    id: '1',
    title: 'Senior Full-Stack Developer',
    department: 'Engineering',
    location: 'Remote / Bangalore',
    type: 'Full-time',
    description: 'Build and maintain our creator protection platform using React, Node.js, and Supabase. Work on contract analysis AI, payment recovery systems, and creator dashboard features.',
    requirements: [
      '5+ years experience with React and Node.js',
      'Experience with TypeScript, PostgreSQL, and cloud services',
      'Strong problem-solving skills and attention to detail',
      'Passion for creator economy and legal tech'
    ]
  },
  {
    id: '2',
    title: 'Legal Advisor (Creator-Focused)',
    department: 'Legal',
    location: 'Remote / Delhi',
    type: 'Full-time',
    description: 'Provide legal advice and contract review services to content creators. Help creators negotiate better deals and recover unpaid amounts through legal notices and recovery processes.',
    requirements: [
      'LLB degree and valid Bar Council registration',
      '3+ years experience in contract law and commercial disputes',
      'Understanding of creator economy and influencer marketing',
      'Excellent communication skills'
    ]
  },
  {
    id: '3',
    title: 'Chartered Accountant (GST & Tax)',
    department: 'Finance',
    location: 'Remote / Mumbai',
    type: 'Full-time',
    description: 'Help creators with GST filing, tax planning, and compliance. Manage creator accounts and provide financial advisory services tailored to the creator economy.',
    requirements: [
      'CA qualification and valid ICAI membership',
      '2+ years experience in GST filing and tax planning',
      'Experience working with freelancers or small businesses',
      'Strong analytical and communication skills'
    ]
  },
  {
    id: '4',
    title: 'Product Designer',
    department: 'Design',
    location: 'Remote / Anywhere',
    type: 'Full-time',
    description: 'Design intuitive, creator-friendly interfaces for our platform. Create user experiences that make legal and financial processes simple and accessible.',
    requirements: [
      '3+ years experience in product design',
      'Portfolio demonstrating UX/UI design skills',
      'Experience with design systems and prototyping tools',
      'Understanding of creator workflows and pain points'
    ]
  },
  {
    id: '5',
    title: 'Content Marketing Intern',
    department: 'Marketing',
    location: 'Remote',
    type: 'Internship',
    description: 'Create content that educates creators about legal and financial best practices. Write blog posts, social media content, and help build our creator community.',
    requirements: [
      'Strong writing and communication skills',
      'Understanding of content creation and social media',
      'Interest in legal/financial topics',
      'Currently pursuing or recently completed degree'
    ]
  }
];

const Careers = () => {
  return (
    <div className="container mx-auto px-6 py-12 nb-screen-height bg-background">
      <Button variant="outline" asChild className="mb-8 text-primary border-border hover:bg-accent hover:text-foreground">
        <Link to="/">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Homepage
        </Link>
      </Button>
      
      <Card className="max-w-4xl mx-auto bg-card p-8 rounded-xl shadow-lg border border-border">
        <header className="mb-8 border-b border-border/50 pb-4">
          <Briefcase className="h-8 w-8 text-primary mb-3" />
          <h1 className="text-3xl font-bold text-foreground mb-2">Careers at CreatorArmour</h1>
          <p className="text-sm text-muted-foreground">Join us in protecting and empowering content creators across India</p>
        </header>

        <div className="prose dark:prose-invert max-w-none space-y-8 text-muted-foreground">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Why Work With Us</h2>
            <p>
              CreatorArmour is building the future of legal and financial protection for content creators. We're a fast-growing startup with a mission to democratize access to professional services for creators.
            </p>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li><strong>Impact:</strong> Help thousands of creators protect their interests and grow their businesses</li>
              <li><strong>Innovation:</strong> Work on cutting-edge legal tech and AI-powered contract analysis</li>
              <li><strong>Growth:</strong> Join a fast-growing team with opportunities for rapid career advancement</li>
              <li><strong>Flexibility:</strong> Remote-first culture with flexible working hours</li>
              <li><strong>Culture:</strong> Collaborative, creator-focused, and mission-driven team</li>
            </ul>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Open Positions</h2>
            
            {MOCK_JOBS.map((job) => (
              <Card key={job.id} className="p-6 border-border">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-foreground mb-2">{job.title}</h3>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge variant="secondary" className="text-xs">
                        <Briefcase className="h-3 w-3 mr-1" />
                        {job.department}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <MapPin className="h-3 w-3 mr-1" />
                        {job.location}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {job.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{job.description}</p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <h4 className="font-semibold text-foreground mb-2">Key Requirements:</h4>
                  <ul className="list-disc list-inside ml-4 space-y-1 text-sm">
                    {job.requirements.map((req, idx) => (
                      <li key={idx}>{req}</li>
                    ))}
                  </ul>
                </div>
                
                <Button asChild className="w-full md:w-auto">
                  <a href={`mailto:careers@creatorarmour.com?subject=Application for ${job.title}`}>
                    Apply Now <ExternalLink className="h-4 w-4 ml-2" />
                  </a>
                </Button>
              </Card>
            ))}
          </div>

          <div className="space-y-4 p-6 bg-muted/50 rounded-lg">
            <h2 className="text-2xl font-bold text-foreground">Don't See a Role That Fits?</h2>
            <p>
              We're always looking for talented people who share our mission. If you're passionate about protecting creators and want to join our team, we'd love to hear from you.
            </p>
            <Button variant="outline" asChild>
              <a href="mailto:careers@creatorarmour.com?subject=General Application">
                Send Us Your Resume <ExternalLink className="h-4 w-4 ml-2" />
              </a>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Careers;

