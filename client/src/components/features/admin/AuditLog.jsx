import { useEffect, useState } from "react";
import Card from "../../ui/Card";
import Button from "../../ui/Button";
import { adminApi } from "../../../services/api.service";

const ACTION_LABELS = {
  user_banned: "Blocked user",
  user_unbanned: "Unblocked user",
  user_role_changed: "Changed role",
  user_deleted: "Deleted user",
  verification_approved: "Approved verification",
  verification_rejected: "Rejected verification",
  report_resolved: "Resolved report",
  report_reviewed: "Reviewed report",
  report_dismissed: "Dismissed report",
  trip_deleted_from_report: "Deleted reported trip",
  content_removed: "Removed content",
};

const PAGE_SIZE = 20;

/**
 * Admin actions, newest first, so admins can see who changed what
 */
const AuditLog = () => {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    adminApi
      .getAuditLog({ page, limit: PAGE_SIZE })
      .then((result) => active && setData(result))
      .catch(() => active && setError(true));
    return () => {
      active = false;
    };
  }, [page]);

  const pages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <Card>
      <h2 className='mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100'>
        Audit log
      </h2>
      {error && (
        <p className='text-sm text-red-700 dark:text-red-400'>
          Couldn&apos;t load the audit log.
        </p>
      )}
      {data && data.entries.length === 0 && (
        <p className='text-sm text-gray-600 dark:text-gray-400'>No admin actions yet.</p>
      )}
      {data && data.entries.length > 0 && (
        <>
          <div className='overflow-x-auto'>
            <table className='min-w-full text-left text-sm'>
              <thead className='border-b border-gray-200 text-gray-700 dark:border-gray-700 dark:text-gray-300'>
                <tr>
                  <th scope='col' className='py-2 pr-4 font-medium'>When</th>
                  <th scope='col' className='py-2 pr-4 font-medium'>Admin</th>
                  <th scope='col' className='py-2 pr-4 font-medium'>Action</th>
                  <th scope='col' className='py-2 font-medium'>Details</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-100 text-gray-900 dark:divide-gray-800 dark:text-gray-100'>
                {data.entries.map((entry) => (
                  <tr key={entry._id}>
                    <td className='whitespace-nowrap py-2 pr-4'>
                      {new Date(entry.createdAt).toLocaleString()}
                    </td>
                    <td className='py-2 pr-4'>{entry.admin?.name ?? "Deleted user"}</td>
                    <td className='whitespace-nowrap py-2 pr-4'>
                      {ACTION_LABELS[entry.actionType] ?? entry.actionType}
                    </td>
                    <td className='py-2'>{entry.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pages > 1 && (
            <div className='mt-4 flex items-center justify-end gap-2 text-sm text-gray-700 dark:text-gray-300'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setPage((p) => p - 1)}
                disabled={page <= 1}
              >
                Newer
              </Button>
              <span>
                Page {page} of {pages}
              </span>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= pages}
              >
                Older
              </Button>
            </div>
          )}
        </>
      )}
    </Card>
  );
};

export default AuditLog;
