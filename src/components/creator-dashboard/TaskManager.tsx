"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, Plus, Calendar as CalendarIcon } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  dueDate: Date;
  completed: boolean;
}

const TaskManager: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Review Nike contract terms',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      completed: false,
    },
    {
      id: '2',
      title: 'Upload content deliverables',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      completed: false,
    },
    {
      id: '3',
      title: 'Follow up on payment reminder',
      dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      completed: true,
    },
  ]);

  const toggleTask = (id: string) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const formatDueDate = (date: Date): string => {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)}d`;
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `Due in ${diffDays}d`;
  };

  const pendingTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  return (
    <Card className="bg-[#0F121A]/80 backdrop-blur-xl border border-white/5 rounded-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="text-lg font-semibold text-white">Your Tasks</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-white/10"
            onClick={() => {
              // Placeholder for add task functionality
              alert('Add task feature coming soon!');
            }}
          >
            <Plus className="h-4 w-4 text-white/60" />
          </Button>
        </div>
        <p className="text-xs text-white/60 mt-2">
          📝 Complete these tasks to increase your Legal Health Score.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {pendingTasks.length === 0 && completedTasks.length === 0 ? (
          <p className="text-sm text-white/60 text-center py-4">No tasks yet. Add one to get started!</p>
        ) : (
          <>
            {pendingTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                onClick={() => toggleTask(task.id)}
              >
                <button className="flex-shrink-0 mt-0.5">
                  <Circle className="h-5 w-5 text-white/40 hover:text-white/60" />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{task.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <CalendarIcon className="h-3 w-3 text-white/40" />
                    <p className="text-xs text-white/40">{formatDueDate(task.dueDate)}</p>
                  </div>
                </div>
              </div>
            ))}
            {completedTasks.length > 0 && (
              <div className="pt-2 border-t border-white/5">
                {completedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 p-3 rounded-xl opacity-60"
                    onClick={() => toggleTask(task.id)}
                  >
                    <button className="flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="h-5 w-5 text-green-400" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white line-through">{task.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TaskManager;

