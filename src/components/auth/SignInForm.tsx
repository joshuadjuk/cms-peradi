import { useState } from "react";
import { useNavigate } from "react-router"; 
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);

  // --- STATE UNTUK PROSES LOGIN ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const navigate = useNavigate();

  // --- FUNGSI SUBMIT KE API PHP ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    
    try {
      const response = await fetch("http://localhost:8000/auth.php?action=login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.status === "success") {
        setIsError(false);
        setMessage(data.message);
        
        localStorage.setItem("user", JSON.stringify(data.data));

        setTimeout(() => {
          navigate("/"); 
        }, 1000);
      } else {
        setIsError(true);
        setMessage(data.message);
      }
    } catch (error) {
      setIsError(true);
      setMessage("Gagal terhubung ke server backend.");
      console.error("Error fetching API:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto mt-10">
        <div>
          <div className="mb-5 sm:mb-8 text-center sm:text-left">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign In ke LCMS PERADI
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Masukkan email dan password Anda untuk masuk ke sistem.
            </p>
          </div>

          <div>
            {/* --- NOTIFIKASI ERROR / SUCCESS --- */}
            {message && (
              <div className={`mb-5 p-4 rounded-lg text-sm text-center font-medium ${isError ? 'bg-error-50 text-error-600 border border-error-200' : 'bg-success-50 text-success-600 border border-success-200'}`}>
                {message}
              </div>
            )}

            {/* --- FORM SUBMIT ACTION --- */}
            <form onSubmit={handleLogin}>
              <div className="space-y-6">
                <div>
                  <Label>
                    Email <span className="text-error-500">*</span>{" "}
                  </Label>
                  <Input 
                    type="email"
                    placeholder="Masukkan alamat email" 
                    value={email}
                    onChange={(e: any) => setEmail(e.target.value)} 
                    required
                  />
                </div>

                <div>
                  <Label>
                    Password <span className="text-error-500">*</span>{" "}
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Masukkan password"
                      value={password}
                      onChange={(e: any) => setPassword(e.target.value)} 
                      required
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      )}
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <Button type="submit" disabled={isLoading} className="w-full" size="sm">
                    {isLoading ? "Memproses..." : "Masuk"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}