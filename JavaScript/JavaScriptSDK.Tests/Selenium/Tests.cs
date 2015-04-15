using System;
using System.Collections.ObjectModel;
using System.IO;
using System.ServiceProcess;
using System.Threading;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using OpenQA.Selenium.Remote;

namespace ApplicationInsights.Javascript.Tests
{
    /// <summary>
    /// Runs QUnit Javascript tests in each browser through Selenium WebDriver and reports
    /// results to standard output (and passes/fails the overall test)
    /// </summary>
    [TestClass]
    public class Tests
    {
        #region IIS express stuff

        private const int PORT = 55555;
        private static IISExpress iisExpress;
        private const string PATH_TO_TESTS = "/Selenium/Tests.html";
        private const string PATH_TO_PERF_TESTS = "/Selenium/PerfTests.html";
        private const string PERF_RESULTS_PATH = @"perfResults.txt";

        [ClassInitialize]
        public static void Setup(TestContext context)
        {
            string localPath = System.IO.Path.GetDirectoryName(typeof(Tests).Assembly.Location);
            iisExpress = new IISExpress(localPath, PORT);
            Assert.IsTrue(iisExpress.Start(), "IIS Express failed to start");
        }

        [ClassCleanup]
        public static void Cleanup()
        {
           iisExpress.Stop();
           iisExpress = null;
        }

        #endregion

        [TestMethod]
        public void Firefox()
        {
            RunTest(new OpenQA.Selenium.Firefox.FirefoxDriver());
        }

        /**
         * Removing IE tests until they fix this bug which prevents selenium from working:
         * https://code.google.com/p/selenium/issues/detail?id=8302
         * https://connect.microsoft.com/IE/feedback/details/1062093/installation-of-kb3025390-breaks-out-of-process-javascript-execution-in-ie11
         */
        //[TestMethod]
        //public void InternetExplorer()
        //{
        //    RunTest(new OpenQA.Selenium.IE.InternetExplorerDriver());
        //}

        //[TestMethod]
        //public void InternetExplorerPerf()
        //{
        //    RunPerfTest(new OpenQA.Selenium.IE.InternetExplorerDriver());
        //}

        [TestMethod]
        public void Safari()
        {
            RunTest(new OpenQA.Selenium.Safari.SafariDriver());
        }

        [TestMethod]
        public void Chrome()
        {
            RunTest(new OpenQA.Selenium.Chrome.ChromeDriver());
        }

        [TestMethod]
        public void FirefoxPerf()
        {
            RunPerfTest(new OpenQA.Selenium.Firefox.FirefoxDriver());
        }

        [TestMethod]
        public void SafariPerf()
        {
            RunPerfTest(new OpenQA.Selenium.Safari.SafariDriver());
        }

        [TestMethod]
        public void ChromePerf()
        {
            RunPerfTest(new OpenQA.Selenium.Chrome.ChromeDriver());
        }

        /// <summary>
        /// Navigates the specified browser driver to the tests page and pulls results with
        /// the help of TestLogger.js (in the Javascript project).
        /// </summary>
        /// <param name="driver"></param>
        private void RunTest(RemoteWebDriver driver)
        {
            using (driver)
            {
                var navigator = driver.Navigate();

                driver.Manage().Timeouts().SetScriptTimeout(new TimeSpan(0, 100, 0));
                navigator.GoToUrl(string.Format("http://localhost:{0}{1}", PORT, PATH_TO_TESTS));
                navigator.Refresh();

                // log test results
                var testStart = DateTime.Now;
                ReadOnlyCollection<object> response = (ReadOnlyCollection<object>)driver.ExecuteScript("return window.AIResults");
                var lastTestsCount = -1;
                int currentTestsCount = response.Count;
                while (lastTestsCount != currentTestsCount)
                {
                    Thread.Sleep(5000);
                    response = (ReadOnlyCollection<object>)driver.ExecuteScript("return window.AIResults");
                    lastTestsCount = currentTestsCount;
                    currentTestsCount = response.Count;
                    if ((DateTime.Now - testStart).Minutes > 5)
                        throw new Exception("Test failed. Timeout.");
                }

                Console.WriteLine("{0} tests executed", response.Count);
                Assert.IsTrue(response.Count > 0, "no tests executed");

                foreach (dynamic testResult in response)
                {
                    string name = testResult["name"];
                    long passed = testResult["passed"];
                    long total = testResult["total"];

                    Console.WriteLine("{0}. passed {1}/{2}", name, passed, total);
                    Assert.IsTrue(passed == total, name);
                }
            }
        }

        /// <summary>
        /// Navigates the specified browser driver to the tests page and pulls results with
        /// the help of TestLogger.js (in the Javascript project).
        /// </summary>
        /// <param name="driver"></param>
        private void RunPerfTest(RemoteWebDriver driver)
        {
            using (driver)
            {
                try
                {
                    var navigator = driver.Navigate();

                    driver.Manage().Timeouts().SetScriptTimeout(new TimeSpan(0, 100, 0));
                    navigator.GoToUrl(string.Format("http://localhost:{0}{1}", PORT, PATH_TO_PERF_TESTS));
                    navigator.Refresh();

                    // log test results
                    ReadOnlyCollection<object> response =
                        (ReadOnlyCollection<object>) driver.ExecuteScript("return window.AIResults");
                    while (response.Count < 4)
                    {
                        Thread.Sleep(1000);
                        response = (ReadOnlyCollection<object>) driver.ExecuteScript("return window.AIResults");
                    }

                    Console.WriteLine("{0} tests executed", response.Count);
                    Assert.IsTrue(response.Count > 0, "no tests executed");

                    foreach (dynamic testResult in response)
                    {
                        string name = testResult["name"];
                        long passed = testResult["passed"];
                        long total = testResult["total"];

                        Console.WriteLine("{0}. passed {1}/{2}", name, passed, total);
                        Assert.IsTrue(passed == total, name, passed.ToString() + " tests passed out of " + total.ToString());
                    }

                    // save perf results
                    dynamic perfResults = driver.ExecuteScript("return window.perfResults");
                    dynamic perfResultsCsv = driver.ExecuteScript("return window.perfResultsCsv");
                    dynamic perfResultsCsvHeaders = driver.ExecuteScript("return window.perfResultsCsvHeaders");
                    Assert.IsNotNull(perfResults, "perf results are not null");
                    Assert.IsNotNull(perfResultsCsv, "perf csv results are not null");
                    Assert.IsNotNull(perfResultsCsvHeaders, "perf csv results are not null");
                    this.writeHelper(PERF_RESULTS_PATH, perfResults, "");
                    this.writeHelper(PERF_RESULTS_PATH + ".csv", perfResultsCsv, perfResultsCsvHeaders);
                }
                catch (Exception exception)
                {
                    var machineName = System.Environment.MachineName;
                    var exceptionPath = PERF_RESULTS_PATH + "_error.txt";
                    var content = DateTime.Now.ToString() + "\t" + machineName + "\r\n" + exception.ToString();
                    this.writeHelper(exceptionPath, content, "");
                    throw exception;
                }
            }
        }

        private void writeHelper(string path, string content, string header)
        {
            if (!File.Exists(path))
            {
                using (StreamWriter sw = File.CreateText(path))
                {
                    if (header.Length > 0)
                    {
                        sw.WriteLine(header);
                    }

                    sw.WriteLine(content);
                }
            }
            else
            {
                using (StreamWriter sw = File.AppendText(path))
                {
                    sw.WriteLine(content);
                }
            }
        }
    }
}
