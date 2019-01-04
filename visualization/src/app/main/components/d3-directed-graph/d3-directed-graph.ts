import {AfterViewInit, Component, ElementRef, Input, OnInit, ViewEncapsulation} from '@angular/core';
import * as d3 from 'd3';
import {Selection} from 'd3-selection';
import {Simulation} from 'd3';
import {D3Model} from './models/d3';
import {NodeModel} from './models/node';

@Component({
  selector: 'app-d3-directed-graph',
  templateUrl: './d3-directed-graph.html',
  styleUrls: ['./d3-directed-graph.scss'],
  encapsulation: ViewEncapsulation.None
})
export class D3DirectedGraphComponent implements OnInit, AfterViewInit {
  @Input()
  public values: Array<NodeModel>;

  private margin: {
    top: number,
    right: number,
    bottom: number,
    left: number
  } = {top: 20, right: 20, bottom: 30, left: 40};
  private width = 660;
  private height = 500;
  private svg: Selection<any, any, any, any>;
  private zoomHolder: Selection<any, any, any, any>;
  private simulation: any;
  private zoomHandler: any;
  private nodeColor = '#ccc';

  constructor(private el: ElementRef) {

  }

  private dragstarted(d: any) {
    if (!d3.event.active) {
      this.simulation.alphaTarget(0.3).restart();
    }
    d.fx = d.x;
    d.fy = d.y;
  }

  private dragged(d: any) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  private dragended(d: any) {
    if (!d3.event.active) {
      this.simulation.alphaTarget(0);
    }
    d.fx = null;
    d.fy = null;
  }

  private zoomActions() {
    this.zoomHolder.attr('transform', d3.event.transform);
  }

  private getData(nodes: Array<NodeModel>): D3Model {
    const d3Model = new D3Model();

    nodes.forEach((node: NodeModel) => {
      d3Model.addNode(node);
      node.getEdges().forEach((edge) => {
        d3Model.addEdge(node.getId(), edge);
      });
    });

    return d3Model;
  }

  private highlightNodes(searchTerm: string) {

    d3.select('.nodes').selectAll('circle')
      .attr('fill', (d: any) => {
        if (searchTerm && searchTerm.length > 0 && d.id.match(searchTerm)) {
          return 'red';
        } else {
          return this.nodeColor;
        }
      });
  }

  private drawData() {
    d3.select('.nodes').remove();
    d3.select('.edges').remove();
    const data = this.getData(this.values);

    const nodes = data.getNodes();
    const edges = data.getEdges();

    const link = this.zoomHolder.append('g')
      .attr('class', 'edges')
      .selectAll('line')
      .data(edges)
      .enter().append('line')
      .attr('class', 'edge')
      .attr('stroke-width', (d: any) => {
        return d.weight;
      });

    const node = this.zoomHolder.append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .call(d3.drag()
        .on('start', this.dragstarted.bind(this))
        .on('drag', this.dragged.bind(this))
        .on('end', this.dragended.bind(this)));

    node.append('circle')
      .attr('r', (d: any) => {
        return d.size + 5;
      })
      .attr('fill', this.nodeColor);

    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dx', (d: any) => {
        return 0;
      })
      .attr('font-size', (d) => {
        let scale = (d.size * 2);
        scale = scale > 32 ? 32 : scale < 10 ? 10 : scale;
        return scale + 'px';
      })
      .attr('dy', '.35em')
      .text((d: any) => {
        return d.id;
      });

    this.simulation
      .nodes(nodes)
      .on('tick', ticked);

    this.simulation
      .force('link')
      .links(edges);

    function ticked() {
      link
        .attr('x1', (d: any) => {
          return d.source.x;
        })
        .attr('y1', (d: any) => {
          return d.source.y;
        })
        .attr('x2', (d: any) => {
          return d.target.x;
        })
        .attr('y2', (d: any) => {
          return d.target.y;
        });

      node.attr('transform', (d: any) => {
        return 'translate(' + d.x + ',' + d.y + ')';
      });
    }
  }

  private initD3() {
    const holderEl = this.el.nativeElement.querySelector('.d3-directed-graph');
    holderEl.innerHTML = '';

    this.svg = d3.select(holderEl)
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height);

    this.zoomHolder = this.svg
      .append('g')
      .attr('class', 'zoom-holder-el');

    this.simulation = d3.forceSimulation()
      .force('collide',
        d3.forceCollide((d: any) => d.size + 20)
          .iterations(4))
      .force('link',
        d3.forceLink()
          .id((d: any) => d.id)
          .distance((d: any) => d.weight)
          .strength(0.5)
      )
      .force('charge', d3.forceManyBody())
      .force('center', d3.forceCenter(this.width / 2, this.height / 2));

    this.zoomHandler = d3.zoom()
      .on('zoom', this.zoomActions.bind(this));

    this.zoomHandler(this.svg);
  }

  ngOnInit(): void {
    this.values = [
      new NodeModel('p1', ['p2', 'p3', 'p4']),
      new NodeModel('p2', ['p1']),
      new NodeModel('p3'),
      new NodeModel('p4')
    ];
  }

  ngAfterViewInit(): void {
    this.width = this.el.nativeElement.offsetWidth;
    this.height = this.el.nativeElement.offsetHeight;
    this.initD3();
    this.drawData();
  }
}
