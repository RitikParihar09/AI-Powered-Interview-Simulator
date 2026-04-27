import React from 'react';
import { Grid } from 'lucide-react';
import GenericAdminPage from './GenericAdminPage';

const Categories = () => {
    return (
        <GenericAdminPage 
            title="Categories" 
            description="Organize questions into logical domains"
            fieldName="role"
            icon={Grid}
        />
    );
};

export default Categories;
