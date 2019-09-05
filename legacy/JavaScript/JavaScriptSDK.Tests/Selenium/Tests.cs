using System;
using System.Collections.ObjectModel;
using System.IO;
using System.ServiceProcess;
using System.Threading;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using OpenQA.Selenium.Remote;
using OpenQA.Selenium.Chrome;

namespace ApplicationInsights.Javascript.Tests
{
    /// <summary>
    /// Runs QUnit Javascript tests in each browser through Selenium WebDriver and reports
    /// results to standard output (and passes/fails the overall test)
    /// </summary>
    [TestClass]
    public class Tests
    {
        public TestContext TestContext { get; set; }
        private static RemoteWebDriver driver { get; set; }

        #region IIS express stuff

        private const int PORT = 55555;
        private static IISExpress iisExpress;
        private const string PATH_TO_TESTS = "/Selenium/Tests.html";
        private const string PATH_TO_PERF_TESTS = "/Selenium/PerfTests.html";
        private const int RETRY_COUNT = 3;

        // We run tests with IsPublicBuild on our build server to maintain public history of perf results (to be shared for each release).
        // For anything but master perf results are supposed to be written locally enabling people to compare
        // perf impact of their commits.
        // To do that - take the latest public perf results, run test locally, apply your changes, run test again.
        // Then compare numbers (or build pivot charts to visualize the perf changes).
        private const string PERF_RESULTS_PATH =
#if IsPublicBuild
@"\\smfiles\Privates\scsouthw\perfResults.txt";
#else
 @".\perfResults.txt";
#endif

        [ClassInitialize]
        public static void Setup(TestContext context)
        {
            string localPath = System.IO.Path.GetDirectoryName(typeof(Tests).Assembly.Location);
            iisExpress = new IISExpress(localPath, PORT);
            Assert.IsTrue(iisExpress.Start(), "IIS Express failed to start");

            Tests.driver = Tests.GetWebDriver();
        }

        [ClassCleanup]
        public static void Cleanup()
        {
            iisExpress.Stop();
            iisExpress = null;

            driver.Quit();
        }

        #endregion

        private static RemoteWebDriver GetWebDriver()
        {
            return new ChromeDriver();
        }

        [TestMethod]
        public void Chrome()
        {
            RunTest(PATH_TO_TESTS);
        }

        [TestMethod]
        public void Chrome_E2E_DisableTelemetryTests()
        {
            RunTest("/E2ETests/E2E.DisableTelemetryTests.htm");
        }

        [TestMethod]
        public void Chrome_E2E_PublicApiTests()
        {
            RunTest("/E2ETests/E2E.PublicApiTests.htm");
        }

        [TestMethod]
        public void Chrome_E2E_SanitizerE2ETests()
        {
            RunTest("/E2ETests/E2E.SanitizerE2ETests.htm");
        }

        [TestMethod]
        public void Chrome_E2E_snippetTests()
        {
            RunTest("/E2ETests/E2E.snippetTests.htm");
        }

        [TestMethod]
        public void Chrome_E2E_ValidateApiTests()
        {
            RunTest("/E2ETests/E2E.ValidateApiTests.htm");
        }

        [TestMethod]
        public void Chrome_E2E_SenderTests()
        {
            RunTest("/E2ETests/E2E.Sender.tests.htm");
        }

        // Tests are failing, need to fix before we enable them.
        /* [TestMethod]
        public void Firefox_E2E_autoCollection()
        {
            RunTest(new OpenQA.Selenium.Firefox.FirefoxDriver(), "/E2ETests/E2E.autoCollection.tests.htm");
        }*/

        #region Disabled - other browsers

        /* [TestMethod]
        public void Firefox_CodeCoverage()
        {
            RunTest(PATH_TO_TESTS, true);
        }*/

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

        //[TestMethod]
        public void Safari()
        {
            //RunTest(new OpenQA.Selenium.Safari.SafariDriver(), PATH_TO_TESTS);
        }

        //[TestMethod]
        public void Firefox()
        {
            //RunTest(new OpenQA.Selenium.Firefox.FirefoxDriver(), PATH_TO_TESTS);
        }

        //[TestMethod]
        public void FirefoxPerf()
        {
            RunPerfTest(new OpenQA.Selenium.Firefox.FirefoxDriver());
        }

        //[TestMethod]
        public void SafariPerf()
        {
            RunPerfTest(new OpenQA.Selenium.Safari.SafariDriver());
        }

        //[TestMethod]
        public void ChromePerf()
        {
            RunPerfTest(new OpenQA.Selenium.Chrome.ChromeDriver());
        }

        #endregion

        /// <summary>
        /// Navigates the specified browser driver to the tests page and pulls results with
        /// the help of TestLogger.js (in the Javascript project).
        /// </summary>
        /// <param name="driver"></param>
        private void RunTest(string pathToTest, bool runCodeCoverage = false)
        {
            bool testRunPassed = false;

            for (int retry = 0; retry < RETRY_COUNT; retry++)
            {
                var navigator = driver.Navigate();

                driver.Manage().Timeouts().SetScriptTimeout(new TimeSpan(0, 100, 0));

                var testUrl = string.Format("http://localhost:{0}{1}", PORT, pathToTest);
                if (runCodeCoverage)
                {
                    testUrl += "?coverage";
                }

                navigator.GoToUrl(testUrl);

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

                    // BUGBUG: don't check results if it's a codecoverage test
                    // 4 tests are failing when CC is enabled, need to fix that. 
                    if (!runCodeCoverage)
                    {
                        if (passed == total)
                        {
                            testRunPassed = true;
                        }
                    }
                }

                if (runCodeCoverage)
                {
                    AttachCodeCoverageReport();
                    testRunPassed = true;
                }

                if (testRunPassed)
                {
                    break;
                }
                else
                {
                    // Log QUnit execution details
                    Console.WriteLine("=== QUnit execution details ===");
                    var tests = driver.FindElementById("qunit-tests").FindElements(OpenQA.Selenium.By.XPath("./li"));

                    foreach (var test in tests)
                    {
                        var result = test.GetAttribute("class");

                        if (result != "pass")
                        {
                            var testName = test.FindElement(OpenQA.Selenium.By.XPath("./strong/span"));
                            Console.WriteLine(string.Format("{0}: {1}", result, testName.GetAttribute("innerHTML")));

                            var steps = test.FindElements(OpenQA.Selenium.By.XPath("./ol/li"));

                            foreach (var step in steps)
                            {
                                Console.Write("   > " + step.GetAttribute("class") + " : ");

                                var stepDetails = step.FindElements(OpenQA.Selenium.By.XPath("./span"));
                                foreach (var details in stepDetails)
                                {
                                    Console.Write(details.GetAttribute("innerHTML") + " ");
                                }

                                Console.WriteLine();
                            }
                        }

                        Console.WriteLine("===");
                    }

                    Console.WriteLine(string.Format("=== RETRY {0} ===", retry));
                }
            }

            Assert.IsTrue(testRunPassed, pathToTest);
        }

        private void AttachCodeCoverageReport()
        {
            // Report file name = Tests.html page title + "Coverage.html"
            string coverageReportName = "TestsforApplicationInsightsJavaScriptAPICoverage.html";

            //collect and attach report...
            var reportPath = Path.Combine(TestContext.TestRunResultsDirectory, coverageReportName);

            var sleepTime = 1000;
            var start = DateTime.Now;

            //wait for file to be downloaded (usually this has already happened by this point).
            while (!File.Exists(reportPath) && DateTime.Now.Subtract(start) < TimeSpan.FromMilliseconds(15000))
            {
                Thread.Sleep(sleepTime);
            }

            if (File.Exists(reportPath))
            {
                AddCodeCoverageFile(reportPath);
            }
            else
            {
                if (File.Exists(reportPath + ".part"))
                {
                    //Even if it was partially downloaded, we will still attach it as HTML
                    File.Move(reportPath + ".part", reportPath);
                    AddCodeCoverageFile(reportPath);
                }
                else
                {
                    Console.WriteLine(string.Format("Test report file not found. {0}", reportPath));
                }
            }
        }

        private void AddCodeCoverageFile(string path)
        {
            Console.WriteLine("Attaching code coverage report {0}", path);
            TestContext.AddResultFile(path);
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
                        (ReadOnlyCollection<object>)driver.ExecuteScript("return window.AIResults");
                    while (response.Count < 4)
                    {
                        Thread.Sleep(1000);
                        response = (ReadOnlyCollection<object>)driver.ExecuteScript("return window.AIResults");
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
