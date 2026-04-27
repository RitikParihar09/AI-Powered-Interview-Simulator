import React from 'react';
import { UserCircle, Tag } from 'lucide-react';
import GenericAdminPage from './GenericAdminPage';

export const Roles = () => {
    return (
        <GenericAdminPage 
            title="Roles" 
            description="Manage different job roles and their questions"
            fieldName="role"
            targetCollection="roles"
            icon={UserCircle}
        />
    );
};

export const Tags = () => {
    return (
        <GenericAdminPage 
            title="Tags" 
            description="Manage skill-based tags for questions"
            fieldName="tags"
            targetCollection="tags"
            icon={Tag}
        />
    );
};
