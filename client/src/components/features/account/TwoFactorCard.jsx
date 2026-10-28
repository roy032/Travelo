import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { KeyRound } from "lucide-react";
import Card from "../../ui/Card";
import Button from "../../ui/Button";
import Input from "../../ui/Input";
import { profileApi } from "../../../services/api.service";

const RecoveryCodes = ({ codes, onDone }) => {
  const text = codes.join("\n");
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Recovery codes copied");
    } catch {
      toast.error("Couldn't copy. Select the codes and copy them instead.");
    }
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([`${text}\n`], { type: "text/plain" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "travelo-recovery-codes.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className='space-y-3'>
      <p className='text-sm text-gray-700 dark:text-gray-300'>
        Save these recovery codes somewhere safe, such as a password manager.
        Each one signs you in once if you lose your phone. They won&apos;t be
        shown again.
      </p>
      <ul
        aria-label='Recovery codes'
        className='grid grid-cols-2 gap-2 rounded-lg bg-gray-100 p-4 font-mono text-sm text-gray-900 dark:bg-gray-800 dark:text-gray-100'
      >
        {codes.map((code) => (
          <li key={code}>{code}</li>
        ))}
      </ul>
      <div className='flex flex-wrap gap-2'>
        <Button variant='outline' size='sm' onClick={copy}>
          Copy
        </Button>
        <Button variant='outline' size='sm' onClick={download}>
          Download
        </Button>
        <Button size='sm' onClick={onDone}>
          I&apos;ve saved them
        </Button>
      </div>
    </div>
  );
};

/**
 * Turn two-factor sign-in with an authenticator app on or off, and make
 * new recovery codes
 */
const TwoFactorCard = () => {
  const [status, setStatus] = useState(null);
  // idle | setup | codes | disable | regenerate
  const [mode, setMode] = useState("idle");
  const [setup, setSetup] = useState(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [codes, setCodes] = useState([]);
  const [busy, setBusy] = useState(false);

  const refresh = () =>
    profileApi
      .twoFactorStatus()
      .then(setStatus)
      .catch(() => setStatus({ enabled: false }));

  useEffect(() => {
    refresh();
  }, []);

  const reset = () => {
    setMode("idle");
    setSetup(null);
    setCode("");
    setPassword("");
  };

  const run = async (action) => {
    setBusy(true);
    try {
      await action();
    } catch {
      // Error toast shown by the API service
    } finally {
      setBusy(false);
    }
  };

  const startSetup = () =>
    run(async () => {
      setSetup(await profileApi.twoFactor("setup"));
      setMode("setup");
    });

  const confirmSetup = (e) => {
    e.preventDefault();
    run(async () => {
      const result = await profileApi.twoFactor("enable", { code: code.replace(/\s/g, "") });
      setCodes(result.recoveryCodes);
      setCode("");
      setMode("codes");
      toast.success("Two-factor sign-in is on");
      refresh();
    });
  };

  const turnOff = (e) => {
    e.preventDefault();
    run(async () => {
      await profileApi.twoFactor("disable", { password, code: code.replace(/\s/g, "") });
      toast.success("Two-factor sign-in is off");
      reset();
      refresh();
    });
  };

  const regenerate = (e) => {
    e.preventDefault();
    run(async () => {
      const result = await profileApi.twoFactor("recovery-codes", {
        code: code.replace(/\s/g, ""),
      });
      setCodes(result.recoveryCodes);
      setCode("");
      setMode("codes");
      refresh();
    });
  };

  const codeInput = (
    <Input
      label='6-digit code from your app'
      name='twoFactorCode'
      value={code}
      onChange={(e) => setCode(e.target.value)}
      inputMode='numeric'
      autoComplete='one-time-code'
      maxLength={7}
      required
    />
  );

  return (
    <Card>
      <div className='space-y-4'>
        <div className='flex items-center gap-2'>
          <KeyRound className='w-5 h-5 text-gray-700 dark:text-gray-300' aria-hidden='true' />
          <h2 className='text-xl font-semibold text-gray-900 dark:text-gray-100'>
            Two-factor sign-in
          </h2>
        </div>

        {mode === "codes" && (
          <RecoveryCodes codes={codes} onDone={() => setMode("idle")} />
        )}

        {mode === "setup" && setup && (
          <form onSubmit={confirmSetup} className='space-y-4'>
            <ol className='list-decimal space-y-1 pl-5 text-sm text-gray-700 dark:text-gray-300'>
              <li>Open an authenticator app such as Google Authenticator, 1Password or Authy.</li>
              <li>Scan this QR code, or enter the key by hand.</li>
              <li>Enter the 6-digit code the app shows.</li>
            </ol>
            <img
              src={setup.qrCode}
              alt='QR code for your authenticator app'
              width={180}
              height={180}
              className='rounded-lg bg-white p-2'
            />
            <p className='text-sm text-gray-700 dark:text-gray-300'>
              Key:{" "}
              <code className='break-all rounded bg-gray-100 px-1 font-mono text-gray-900 dark:bg-gray-800 dark:text-gray-100'>
                {setup.secret}
              </code>
            </p>
            {codeInput}
            <div className='flex gap-2'>
              <Button type='submit' loading={busy} disabled={busy}>
                Turn on
              </Button>
              <Button type='button' variant='outline' onClick={reset} disabled={busy}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {mode === "disable" && (
          <form onSubmit={turnOff} className='space-y-4'>
            <Input
              label='Password'
              type='password'
              name='twoFactorPassword'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete='current-password'
              required
            />
            {codeInput}
            <div className='flex gap-2'>
              <Button type='submit' variant='danger' loading={busy} disabled={busy}>
                Turn off
              </Button>
              <Button type='button' variant='outline' onClick={reset} disabled={busy}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {mode === "regenerate" && (
          <form onSubmit={regenerate} className='space-y-4'>
            <p className='text-sm text-gray-700 dark:text-gray-300'>
              Your old recovery codes stop working.
            </p>
            {codeInput}
            <div className='flex gap-2'>
              <Button type='submit' loading={busy} disabled={busy}>
                Make new codes
              </Button>
              <Button type='button' variant='outline' onClick={reset} disabled={busy}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {mode === "idle" && status && (
          <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
            <p className='text-sm text-gray-700 dark:text-gray-300'>
              {status.enabled
                ? `On. You have ${status.recoveryCodesLeft} recovery codes left.`
                : "Off. Turn it on so a stolen password isn't enough to get into your account."}
            </p>
            {status.enabled ? (
              <div className='flex shrink-0 gap-2'>
                <Button variant='outline' size='sm' onClick={() => setMode("regenerate")}>
                  New recovery codes
                </Button>
                <Button variant='outline' size='sm' onClick={() => setMode("disable")}>
                  Turn off
                </Button>
              </div>
            ) : (
              <Button size='sm' onClick={startSetup} loading={busy} disabled={busy}>
                Turn on
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default TwoFactorCard;
