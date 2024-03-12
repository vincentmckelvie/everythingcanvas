const path = require('path');
const WebpackObfuscator = require('webpack-obfuscator');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require("terser-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const finalPath = path.resolve(__dirname, "dist");
module.exports = {
  mode:"production",
  entry: {
    main: path.resolve(__dirname,"src/main.js"),
  },
  output:{
    path: path.resolve(__dirname,"dist"),
    filename:"[name].js"
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        test: /\.js(\?.*)?$/i,
      }),
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: "./src/extras",
          to: path.join(finalPath, "/extras"),
          force: true,
        },{
          from: "./src/index.min.html",
          to: path.join(finalPath, "/index.html"),
          force: true,
        },{
          from: "./src/styles.min.css",
          to: path.join(finalPath, "/styles.css"),
          force: true,
        }
      ],
    })
  ],
  

};

/*





,module:{
    rules: [
      {
          test: /\.js$/,
          enforce: 'post',
          use: { 
              loader: WebpackObfuscator.loader, 
              options: {
                  rotateStringArray: true
              }
          }
      }
    ],
  },
  plugins: [
    new WebpackObfuscator({
        rotateStringArray: true
    }, [])
  ]





plugins: [
    new HtmlWebpackPlugin({
      template: 'src/bots.html',
      filename: "bots.html"
    }),
  ]
 module: {
    rules: [
      {
        test: /\.txt$/,
        use: [
          {
            loader: 'html-loader',
            options: {minimise: true}
          }
        ]
      },
    ]
  },


*/