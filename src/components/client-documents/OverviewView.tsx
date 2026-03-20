/** @jsxImportSource react */
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, File, FolderOpen, Tag, Settings, Briefcase, Handshake, Wallet, Badge as BadgeIcon, Home, MoreVertical, Trash2, FileUp } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Case, Category } from '@/types';

// Map system category names to Lucide React icons (re-declared here for self-containment)
const systemCategoryIcons: { [key: string]: React.ElementType } = {
  'Identity Documents': BadgeIcon, // Added Identity Documents icon
  'Financial Records': Wallet,
  'Property Documents': Home,
  'Business & Incorporation': Briefcase,
  'Contracts & Agreements': Handshake,
};

interface OverviewViewProps {
  cases: Case[];
  isLoadingCases: boolean;
  categories: Category[];
  isLoadingCategories: boolean;
  setCurrentView: (view: { type: 'case'; id: string } | { type: 'category'; id: string } | { type: 'unlinked' }) => void;
  handleOpenCategoryForm: (category?: Category) => void;
  handleDeleteCategory: (categoryId: string, categoryName: string) => Promise<void>;
  setIsUploadDialogOpen: (isOpen: boolean) => void;
  setIsQuickActionsOpen: (isOpen: boolean) => void;
}

const OverviewView: React.FC<OverviewViewProps> = ({
  cases,
  isLoadingCases,
  categories,
  isLoadingCategories,
  setCurrentView,
  handleOpenCategoryForm,
  handleDeleteCategory,
  setIsUploadDialogOpen,
  setIsQuickActionsOpen,
}) => {
  return (
    <div className="space-y-8">
      {/* Your Categories Section (Moved to Top) */}
      <section className="bg-card p-6 rounded-lg shadow-sm border border-border">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-foreground">Your Categories</h2>
        </div>
        {isLoadingCategories ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-3 text-lg text-muted-foreground">Loading categories...</p>
          </div>
        ) : categories && categories.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => {
              const CategoryIcon = systemCategoryIcons[category.name] || Tag;
              return (
                <Card
                  key={category.id}
                  className="bg-secondary p-4 rounded-lg shadow-sm border border-border cursor-pointer hover:bg-secondary/80 transition-colors relative"
                  onClick={() => setCurrentView({ type: 'category', id: category.id })}
                >
                  <CardHeader className="flex flex-col items-center justify-center space-y-2 p-0 mb-2 min-h-[80px]">
                    <CategoryIcon className="h-8 w-8 text-purple-400" />
                    <CardTitle className="text-lg font-semibold text-foreground text-center">
                      {category.name}
                    </CardTitle>
                  </CardHeader>
                  {!category.is_system_category && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-8 w-8 text-muted-foreground hover:bg-accent hover:text-foreground">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-card text-foreground border-border">
                        <DropdownMenuItem asChild onClick={(e) => { e.stopPropagation(); setIsUploadDialogOpen(true); setIsQuickActionsOpen(false); }} className="hover:bg-accent hover:text-foreground">
                          <div className="flex items-center w-full"> {/* Use div as single child */}
                            <span> {/* Added wrapper span */}
                              <FileUp className="h-4 w-4 mr-2" /> Add Document
                            </span>
                          </div>
                        </DropdownMenuItem>
                          <DropdownMenuItem asChild onClick={(e) => { e.stopPropagation(); handleOpenCategoryForm(category); }} className="hover:bg-accent hover:text-foreground">
                            <div className="flex items-center w-full"> {/* Use div as single child */}
                              <span> {/* Added wrapper span */}
                                <Settings className="h-4 w-4 mr-2" /> Edit Category
                              </span>
                            </div>
                          </DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem asChild onSelect={(e) => e.preventDefault()} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                                <div className="flex items-center w-full"> {/* Use div as single child */}
                                  <span> {/* Added wrapper span */}
                                    <Trash2 className="h-4 w-4 mr-2" /> Delete Category
                                  </span>
                                </div>
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-card text-foreground border-border">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription className="text-muted-foreground">
                                  This action cannot be undone. This will permanently delete the category
                                  "{category.name}" and unlink all documents associated with it.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="text-foreground border-border hover:bg-accent">Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteCategory(category.id, category.name)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  <CardContent className="p-0 text-sm text-muted-foreground">
                    {/* Removed 'Created' date */}
                  </CardContent>
                </Card>
              );
            })}
            {/* Card for documents not linked to a case or category */}
            <Card
              className="bg-secondary p-4 rounded-lg shadow-sm border border-border cursor-pointer hover:bg-secondary/80 transition-colors"
              onClick={() => setCurrentView({ type: 'unlinked' })}
            >
              <CardHeader className="flex flex-col items-center justify-center space-y-2 p-0 mb-2 min-h-[80px]">
                <File className="h-8 w-8 text-gray-400" />
                <CardTitle className="text-lg font-semibold text-foreground text-center">
                  Unlinked Documents
                </CardTitle>
              </CardHeader>
              <Badge variant="outline" className="absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full">Misc</Badge>
              <CardContent className="p-0 text-sm text-muted-foreground text-center">
                {/* Removed the descriptive text */}
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="bg-card p-4 rounded-lg shadow-sm border border-border text-center">
            <p className="text-muted-foreground">No categories found. Create your first category!</p>
          </Card>
        )}
      </section>

      {/* Your Cases Section (Moved to Bottom) */}
      <section className="bg-card p-6 rounded-lg shadow-sm border border-border">
        <h2 className="text-xl font-semibold text-foreground mb-4">Your Cases (Folders)</h2>
        {isLoadingCases ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-3 text-lg text-muted-foreground">Loading cases...</p>
          </div>
        ) : cases && cases.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cases.map((_case) => (
              <Card
                key={_case.id}
                className="bg-secondary p-4 rounded-lg shadow-sm border border-border cursor-pointer hover:bg-secondary/80 transition-colors"
                onClick={() => setCurrentView({ type: 'case', id: _case.id })}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 mb-2">
                  <CardTitle className="text-lg font-semibold text-foreground flex items-center">
                    <FolderOpen className="h-5 w-5 mr-2 text-blue-400" /> {_case.title}
                  </CardTitle>
                  <Badge variant="outline">{_case.status}</Badge>
                </CardHeader>
                <CardContent className="p-0 text-sm text-muted-foreground">
                  <p>Created: {new Date(_case.created_at).toLocaleDateString()}</p>
                  <p>Deadline: {_case.deadline ? new Date(_case.deadline).toLocaleDateString() : 'N/A'}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-card p-4 rounded-lg shadow-sm border border-border text-center">
            <p className="text-muted-foreground">No cases found.</p>
          </Card>
        )}
      </section>
    </div>
  );
};

export default OverviewView;