using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PathsFixTool
{
	class Program
	{
		static void Main(string[] args)
		{
			Console.WriteLine("Templates with fixed paths for db will be placed in \"pages-to-db\" folder (y/n)?");
			ConsoleKeyInfo? key = null;
			while (key?.KeyChar.ToString().ToLower() != "n")
			{
				key = Console.ReadKey(true);
				
				if (key.Value.KeyChar.ToString().ToLower() == "y")
				{
					DoFixPaths();
					return;
				}
			}
		}

		private static void DoFixPaths()
		{
			var srcDirectory = new DirectoryInfo(".");
			var resultDirectory = new DirectoryInfo("./pages-to-db");
			if(resultDirectory.Exists)
			{
				resultDirectory.Delete(true);
			}

			resultDirectory.Create();

			var files = srcDirectory.GetFiles("*.html");
			foreach (var file in files)
			{
				using (var sr = file.OpenText())
				{
					var text = sr.ReadToEnd();
					var textWithFixedPaths = text.Replace("=\"content", "=\"/content");

					using (var resultFile = File.CreateText(
						Path.Combine(resultDirectory.FullName, file.Name)))
					{
						resultFile.Write(textWithFixedPaths);
					}
				}
			}
		}
	}
}
