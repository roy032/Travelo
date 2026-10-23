import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Download, LogOut, ShieldCheck, Trash2 } from "lucide-react";
import Card from "../../ui/Card";
import Button from "../../ui/Button";
import Input from "../../ui/Input";
import Modal from "../../ui/Modal";
import { useAuth } from "../../../hooks/useAuth";
import { profileApi } from "../../../services/api.service";

/**
 * Privacy controls on the profile page: download your data, sign out on
 * every device and delete the account
 */
const AccountDataCard = () => {
  const { clearSession } = useAuth();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleSignOutEverywhere = async () => {
    setSigningOut(true);
    try {
      await profileApi.signOutEverywhere();
      navigate("/login", { replace: true });
      await clearSession();
      toast.success("Signed out on all devices");
    } catch {
      // Error toast shown by the API service
      setSigningOut(false);
    }
  };

  const closeDelete = () => {
    if (deleting) return;
    setDeleteOpen(false);
    setPassword("");
    setConfirmText("");
  };

  const handleDelete = async (event) => {
    event.preventDefault();
    setDeleting(true);
    try {
      await profileApi.deleteAccount(password);
      // The profile page is protected, so once signed out it goes to
      // sign-in either way
      navigate("/login", { replace: true });
      await clearSession();
      toast.success("Your account has been deleted");
    } catch {
      setDeleting(false);
    }
  };

  const canDelete = password.length > 0 && confirmText.trim() === "DELETE";

  return (
    <Card>
      <div className='space-y-5'>
        <div className='flex items-center gap-2'>
          <ShieldCheck
            className='w-5 h-5 text-gray-700 dark:text-gray-300'
            aria-hidden='true'
          />
          <h2 className='text-xl font-semibold text-gray-900 dark:text-gray-100'>
            Privacy and Data
          </h2>
        </div>

        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <h3 className='font-medium text-gray-900 dark:text-gray-100'>
              Download your data
            </h3>
            <p className='text-sm text-gray-600 dark:text-gray-400'>
              A JSON file with your profile, trips, expenses, notes, messages
              and everything else you have added.
            </p>
          </div>
          <a
            href={profileApi.exportUrl}
            download
            className='inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border-2 border-blue-600 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-blue-400 dark:text-blue-300 dark:hover:bg-blue-950 dark:focus-visible:ring-offset-gray-900'
          >
            <Download className='h-4 w-4' aria-hidden='true' />
            Download data
          </a>
        </div>

        <div className='flex flex-col gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:items-center sm:justify-between dark:border-gray-700'>
          <div>
            <h3 className='font-medium text-gray-900 dark:text-gray-100'>
              Sign out everywhere
            </h3>
            <p className='text-sm text-gray-600 dark:text-gray-400'>
              Ends every session, including this one. Use it if you signed in
              on a device you no longer use.
            </p>
          </div>
          <Button
            variant='outline'
            size='sm'
            onClick={handleSignOutEverywhere}
            loading={signingOut}
            disabled={signingOut}
            className='gap-2'
          >
            <LogOut className='h-4 w-4' aria-hidden='true' />
            Sign out everywhere
          </Button>
        </div>

        <div className='flex flex-col gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:items-center sm:justify-between dark:border-gray-700'>
          <div>
            <h3 className='font-medium text-red-700 dark:text-red-400'>
              Delete account
            </h3>
            <p className='text-sm text-gray-600 dark:text-gray-400'>
              Permanently deletes your account and personal data. This
              can&apos;t be undone.
            </p>
          </div>
          <Button
            variant='danger'
            size='sm'
            onClick={() => setDeleteOpen(true)}
            className='gap-2'
          >
            <Trash2 className='h-4 w-4' aria-hidden='true' />
            Delete account
          </Button>
        </div>
      </div>

      <Modal isOpen={deleteOpen} onClose={closeDelete} title='Delete your account?'>
        <form onSubmit={handleDelete} className='space-y-4'>
          <ul className='list-disc space-y-1 pl-5 text-sm text-gray-700 dark:text-gray-300'>
            <li>Trips only you are in are deleted with everything in them.</li>
            <li>
              Trips you own with other people pass to the member who joined
              first, so the group keeps its plans.
            </li>
            <li>
              Your messages, photos, private notes, reviews, favorites and
              identity documents are deleted.
            </li>
            <li>
              Shared expenses, itinerary items and shared notes stay with the
              group, shown as added by &ldquo;Deleted user&rdquo;.
            </li>
          </ul>
          <p className='text-sm text-gray-700 dark:text-gray-300'>
            Want a copy first?{" "}
            <a
              href={profileApi.exportUrl}
              download
              className='font-medium text-blue-700 underline dark:text-blue-300'
            >
              Download your data
            </a>
            .
          </p>
          <Input
            label='Password'
            type='password'
            name='deletePassword'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete='current-password'
            required
          />
          <Input
            label='Type DELETE to confirm'
            name='deleteConfirm'
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            autoComplete='off'
            required
          />
          <div className='flex justify-end gap-2'>
            <Button
              type='button'
              variant='outline'
              onClick={closeDelete}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              variant='danger'
              loading={deleting}
              disabled={!canDelete || deleting}
            >
              Delete my account
            </Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
};

export default AccountDataCard;
