import React from 'react';
import { Building2 } from 'lucide-react';
import GenericAdminPage from './GenericAdminPage';

const Companies = () => {
    return (
        <GenericAdminPage 
            title="Companies" 
            description="Manage company-specific interview questions"
            fieldName="company"
            targetCollection="companies"
            icon={Building2}
        />
    );
};

export default Companies;
