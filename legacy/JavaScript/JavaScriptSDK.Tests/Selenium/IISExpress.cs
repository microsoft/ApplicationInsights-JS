using Microsoft.Win32;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Text;

namespace ApplicationInsights.Javascript.Tests
{
    /// <summary>
    /// Wrapper for starting up IIS Express to host test files.
    /// </summary>
    internal class IISExpress
    {
        private Process process;
        private readonly string path;
        private readonly int port;

        /// <summary>
        /// Constructor that specifies the path to the project and the port number to listen on.
        /// </summary>
        /// <param name="path">Path to root of local server</param>
        /// <param name="port">Port to listen for HTTP requests</param>
        internal IISExpress(string path, int port)
        {
            this.path = path;
            this.port = port;
        }

        /// <summary>
        /// Starts IIS express
        /// </summary>
        /// <returns></returns>
        internal bool Start()
        {
            Debug.Assert(this.process == null, "IIS Express was already started");

            string iisExpress = FindIISExpress();
            if (string.IsNullOrEmpty(iisExpress))
            {
                return false;
            }

            this.process = Process.Start(new ProcessStartInfo()
            {
                FileName = iisExpress,
                Arguments = string.Format("/path:\"{0}\" /port:{1}", this.path, this.port),
                RedirectStandardInput = true,
                RedirectStandardOutput = true,
                CreateNoWindow = false,
                UseShellExecute = false,
            });

            StringBuilder data = new StringBuilder();
            char[] buffer = new char[1024];
            while (!IsRunning(data.ToString()) && !FailedToRun(data.ToString()))
            {
                int r = this.process.StandardOutput.Read(buffer, 0, 1024);
                data.Append(buffer, 0, r);
            }

            if (!IsRunning(data.ToString()))
            {
                Stop();
                return false;
            }

            this.process.StandardOutput.Close();
            return true;
        }

        internal void Stop()
        {
            if (this.process != null)
            {
                this.process.StandardInput.Write("Q\r\n");
                this.process.StandardInput.Flush();
                this.process.StandardInput.Close();
                this.process.WaitForExit(4000);
                if (!this.process.HasExited)
                {
                    this.process.Kill();
                }

                using (this.process)
                {
                    this.process = null;
                }
            }
        }

        private static bool IsRunning(string consoleOutput)
        {
            // Add more strings here if they change in different versions of iisexpress
            return consoleOutput.Contains("IIS Express is running") || consoleOutput.ToUpperInvariant().Contains("SUCCESSFULLY REGISTERED URL");
        }

        private static bool FailedToRun(string consoleOutput)
        {
            // Add more strings here if they change in different versions of iisexpress
            return consoleOutput.Contains("Unable to start iisexpress") || consoleOutput.ToUpperInvariant().Contains("CANNOT CREATE A FILE WHEN THAT FILE ALREADY EXISTS");
        }

        #region iisexpress.exe Search

        private static string FindIISExpress()
        {
            RegistryKey rk = GetIISExpressKeys(RegistryView.Registry32)
                .Concat(GetIISExpressKeys(RegistryView.Registry64))
                .FirstOrDefault(IISExists);

            if (rk != null)
            {
                return GetIISExe(rk);
            }
            else
            {
                return null;
            }
        }

        private static IEnumerable<RegistryKey> GetIISExpressKeys(RegistryView view)
        {
            RegistryKey hklm = RegistryKey.OpenBaseKey(RegistryHive.LocalMachine, view);
            if (hklm != null)
            {
                using (hklm)
                {
                    RegistryKey iisRoot = hklm.OpenSubKey(@"SOFTWARE\Microsoft\IISExpress");
                    if (iisRoot != null)
                    {
                        using (iisRoot)
                        {
                            List<string> subkeys = iisRoot.GetSubKeyNames().ToList();
                            // Latest version first
                            subkeys.Sort((a, b) => Version.Parse(b).CompareTo(Version.Parse(a)));

                            foreach (string subkey in subkeys)
                            {
                                yield return iisRoot.OpenSubKey(subkey);
                            }
                        }
                    }
                }
            }
        }

        private static string GetIISExe(RegistryKey rk)
        {
            string path = rk.GetValue("InstallPath", null) as string;
            if (path != null)
            {
                return System.IO.Path.Combine(path, "iisexpress.exe");
            }

            return null;
        }

        private static bool IISExists(RegistryKey rk)
        {
            string iisexe = GetIISExe(rk);
            return !string.IsNullOrEmpty(iisexe) && System.IO.File.Exists(iisexe);
        }

        #endregion 
    }
}
