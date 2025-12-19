import { Link } from "react-router-dom";
import ReportList from "../components/admin/ReportList";
import Button from "../components/ui/Button";
import { Users, Flag } from "lucide-react";

/**
 * Admin Reports Page - View and manage trip reports
 */
const AdminReportsPage = () => {
  return (
    <div className='min-h-screen bg-gray-50 p-6'>
      <div className='max-w-7xl mx-auto'>
        {/* Admin Navigation */}
        <div className='flex gap-2 mb-6'>
          <Link to='/admin'>
            <Button variant='outline' size='sm'>
              <Users className='w-4 h-4 mr-2' />
              Users
            </Button>
          </Link>
          <Link to='/admin/reports'>
            <Button variant='primary' size='sm'>
              <Flag className='w-4 h-4 mr-2' />
              Trip Reports
            </Button>
          </Link>
        </div>

        <ReportList />
      </div>
    </div>
  );
};

export default AdminReportsPage;
